package deploy

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	yaml "gopkg.in/yaml.v2"

	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/httputils/pkg/httperror"
	"github.com/ViBiOh/httputils/pkg/httpjson"
	"github.com/ViBiOh/httputils/pkg/request"
	"github.com/ViBiOh/httputils/pkg/tools"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/network"
)

const (
	// DeployTimeout indicates delay for application to deploy before rollback
	DeployTimeout = 3 * time.Minute

	defaultCPUShares = 128
	minMemory        = 16777216
	maxMemory        = 805306368
	colonSeparator   = `:`
	deploySuffix     = `_deploy`
)

var errHealthCheckFailed = errors.New(`Health check failed`)

type dockerComposeHealthcheck struct {
	Test     []string
	Interval string
	Timeout  string
	Retries  int
}

type dockerComposeService struct {
	Image         string
	Command       []string
	Environment   map[string]string
	Labels        map[string]string
	Ports         []string
	Links         []string
	ExternalLinks []string `yaml:"external_links"`
	Volumes       []string
	Hostname      string
	User          string
	Healthcheck   *dockerComposeHealthcheck
	ReadOnly      bool  `yaml:"read_only"`
	CPUShares     int64 `yaml:"cpu_shares"`
	MemoryLimit   int64 `yaml:"mem_limit"`
}

type dockerCompose struct {
	Version  string
	Services map[string]dockerComposeService
}

type deployedService struct {
	ID   string
	Name string
}

// App stores informations
type App struct {
	tasks         sync.Map
	dockerApp     *docker.App
	authApp       *auth.App
	network       string
	tag           string
	containerUser string
}

// NewApp creates new App from Flags' config
func NewApp(config map[string]*string, authApp *auth.App, dockerApp *docker.App) *App {
	return &App{
		tasks:         sync.Map{},
		dockerApp:     dockerApp,
		authApp:       authApp,
		network:       strings.TrimSpace(*config[`network`]),
		tag:           strings.TrimSpace(*config[`tag`]),
		containerUser: strings.TrimSpace(*config[`containerUser`]),
	}
}

// Flags adds flags for given prefix
func Flags(prefix string) map[string]*string {
	return map[string]*string{
		`network`:       flag.String(tools.ToCamel(fmt.Sprintf(`%sNetwork`, prefix)), `traefik`, `[deploy] Default Network`),
		`tag`:           flag.String(tools.ToCamel(fmt.Sprintf(`%sTag`, prefix)), `latest`, `[deploy] Default image tag)`),
		`containerUser`: flag.String(tools.ToCamel(fmt.Sprintf(`%sContainerUser`, prefix)), `1000`, `[deploy] Default container user`),
	}
}

// CanBeGracefullyClosed indicates if application can terminate safely
func (a *App) CanBeGracefullyClosed() (canBe bool) {
	canBe = true

	a.tasks.Range(func(_ interface{}, value interface{}) bool {
		canBe = !value.(bool)
		return canBe
	})

	return
}

func getHealthcheckConfig(healthcheck *dockerComposeHealthcheck) (*container.HealthConfig, error) {
	healthconfig := container.HealthConfig{
		Test:    healthcheck.Test,
		Retries: healthcheck.Retries,
	}

	if strings.TrimSpace(healthcheck.Interval) != `` {
		interval, err := time.ParseDuration(healthcheck.Interval)
		if err != nil {
			return nil, fmt.Errorf(`Error while parsing healthcheck interval: %v`, err)
		}

		healthconfig.Interval = interval
	}

	if strings.TrimSpace(healthcheck.Timeout) != `` {
		timeout, err := time.ParseDuration(healthcheck.Timeout)
		if err != nil {
			return nil, fmt.Errorf(`Error while parsing healthcheck timeout: %v`, err)
		}

		healthconfig.Timeout = timeout
	}

	return &healthconfig, nil
}

func (a *App) getConfig(service *dockerComposeService, user *model.User, appName string) (*container.Config, error) {
	environments := make([]string, 0, len(service.Environment))
	for key, value := range service.Environment {
		environments = append(environments, fmt.Sprintf(`%s=%s`, key, value))
	}

	if service.Labels == nil {
		service.Labels = make(map[string]string)
	}

	service.Labels[commons.OwnerLabel] = user.Username
	service.Labels[commons.AppLabel] = appName

	config := container.Config{
		Hostname: service.Hostname,
		Image:    service.Image,
		Labels:   service.Labels,
		Env:      environments,
		User:     service.User,
	}

	if config.User == `` {
		config.User = a.containerUser
	}

	if len(service.Command) != 0 {
		config.Cmd = service.Command
	}

	if service.Healthcheck != nil {
		healthcheck, err := getHealthcheckConfig(service.Healthcheck)
		if err != nil {
			return nil, err
		}

		config.Healthcheck = healthcheck
	}

	return &config, nil
}

func getVolumesConfig(hostConfig *container.HostConfig, volumes []string) {
	for _, rawVolume := range volumes {
		parts := strings.Split(rawVolume, colonSeparator)

		if len(parts) > 1 && parts[0] != `/` && parts[0] != `/var/run/docker.sock` {
			volume := mount.Mount{Type: mount.TypeBind, BindOptions: &mount.BindOptions{Propagation: mount.PropagationRPrivate}, Source: parts[0], Target: parts[1]}
			if len(parts) > 2 && parts[2] == `ro` {
				volume.ReadOnly = true
			}

			hostConfig.Mounts = append(hostConfig.Mounts, volume)
		}
	}
}

func (a *App) getHostConfig(service *dockerComposeService, user *model.User) *container.HostConfig {
	hostConfig := container.HostConfig{
		LogConfig: container.LogConfig{Type: `json-file`, Config: map[string]string{
			`max-size`: `10m`,
		}},
		NetworkMode:   container.NetworkMode(a.network),
		RestartPolicy: container.RestartPolicy{Name: `on-failure`, MaximumRetryCount: 5},
		Resources: container.Resources{
			CPUShares: defaultCPUShares,
			Memory:    minMemory,
		},
		SecurityOpt: []string{`no-new-privileges`},
	}

	if service.ReadOnly {
		hostConfig.ReadonlyRootfs = true
	}

	if service.CPUShares != 0 {
		hostConfig.Resources.CPUShares = service.CPUShares
	}

	if service.MemoryLimit != 0 {
		if service.MemoryLimit <= maxMemory {
			hostConfig.Resources.Memory = service.MemoryLimit
		} else {
			hostConfig.Resources.Memory = maxMemory
		}
	}

	if docker.IsAdmin(user) && len(service.Volumes) > 0 {
		getVolumesConfig(&hostConfig, service.Volumes)
	}

	return &hostConfig
}

func addLinks(settings *network.EndpointSettings, links []string) {
	for _, link := range links {
		linkParts := strings.Split(link, colonSeparator)
		target := linkParts[0]
		alias := linkParts[0]

		if len(linkParts) > 1 {
			alias = linkParts[1]
		}

		settings.Links = append(settings.Links, fmt.Sprintf(`%s%s%s`, target, colonSeparator, alias))
	}
}

func (a *App) getNetworkConfig(serviceName string, service *dockerComposeService) *network.NetworkingConfig {
	endpointConfig := network.EndpointSettings{}
	endpointConfig.Aliases = append(endpointConfig.Aliases, serviceName)

	addLinks(&endpointConfig, service.Links)
	addLinks(&endpointConfig, service.ExternalLinks)

	return &network.NetworkingConfig{
		EndpointsConfig: map[string]*network.EndpointSettings{
			a.network: &endpointConfig,
		},
	}
}

func (a *App) pullImage(ctx context.Context, image string) error {
	if !strings.Contains(image, colonSeparator) {
		image = fmt.Sprintf(`%s%slatest`, image, colonSeparator)
	}

	pull, err := a.dockerApp.Docker.ImagePull(ctx, image, types.ImagePullOptions{})
	if err != nil {
		return fmt.Errorf(`Error while pulling image: %v`, err)
	}

	_, err = request.ReadBody(pull)
	return err
}

func (a *App) cleanContainers(ctx context.Context, containers []types.Container) error {
	for _, container := range containers {
		if _, err := a.dockerApp.GracefulStopContainer(ctx, container.ID, time.Minute); err != nil {
			return fmt.Errorf(`Error while stopping container %s: %v`, container.Names, err)
		}
	}

	for _, container := range containers {
		if _, err := a.dockerApp.RmContainer(ctx, container.ID, nil, false); err != nil {
			return fmt.Errorf(`Error while deleting container %s: %v`, container.Names, err)
		}
	}

	return nil
}

func (a *App) renameDeployedContainers(ctx context.Context, containers map[string]*deployedService) error {
	for service, container := range containers {
		if err := a.dockerApp.Docker.ContainerRename(ctx, container.ID, getFinalName(container.Name)); err != nil {
			return fmt.Errorf(`Error while renaming container %s: %v`, service, err)
		}
	}

	return nil
}

func getServiceFullName(app string, service string) string {
	return fmt.Sprintf(`%s_%s%s`, app, service, deploySuffix)
}

func getFinalName(serviceFullName string) string {
	return strings.TrimSuffix(serviceFullName, deploySuffix)
}

func (a *App) logServiceOutput(ctx context.Context, user *model.User, appName string, service *deployedService) {
	logs, err := a.dockerApp.Docker.ContainerLogs(ctx, service.ID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: false})
	if logs != nil {
		defer func() {
			if err = logs.Close(); err != nil {
				log.Printf(`[%s] [%s] Error while closing logs for service: %v`, user.Username, appName, err)
			}
		}()
	}
	if err != nil {
		log.Printf(`[%s] [%s] Error while reading logs for service %s: %v`, user.Username, appName, service.Name, err)
		return
	}

	logsContent := make([]string, 0)
	logsContent = append(logsContent, "\n")

	scanner := bufio.NewScanner(logs)
	for scanner.Scan() {
		logLine := scanner.Bytes()
		if len(logLine) > commons.IgnoredByteLogSize {
			logsContent = append(logsContent, string(logLine[commons.IgnoredByteLogSize:]))
			logsContent = append(logsContent, "\n")
		}
	}

	log.Printf(`[%s] [%s] Logs output for %s: %s`, user.Username, appName, service.Name, logsContent)
}

func logServiceHealth(user *model.User, appName string, service *deployedService, infos *types.ContainerJSON) {
	if infos.State.Health != nil {
		inspectOutput := make([]string, 0)
		inspectOutput = append(inspectOutput, "\n")

		for _, log := range infos.State.Health.Log {
			inspectOutput = append(inspectOutput, fmt.Sprintf(`code=%d, log=%s`, log.ExitCode, log.Output))
		}

		log.Printf(`[%s] [%s] Healthcheck output for %s: %s`, user.Username, appName, service.Name, inspectOutput)
	}
}

func (a *App) deleteServices(ctx context.Context, appName string, services map[string]*deployedService, user *model.User) {
	for service, container := range services {
		a.logServiceOutput(ctx, user, appName, container)

		infos, err := a.dockerApp.InspectContainer(ctx, container.ID)
		if err != nil {
			log.Printf(`[%s] [%s] Error while inspecting service %s: %v`, user.Username, appName, service, err)
		} else {
			logServiceHealth(user, appName, container, infos)

			if _, err := a.dockerApp.StopContainer(ctx, container.ID, infos); err != nil {
				log.Printf(`[%s] [%s] Error while stopping service %s: %v`, user.Username, appName, service, err)
			}

			if _, err := a.dockerApp.RmContainer(ctx, container.ID, infos, true); err != nil {
				log.Printf(`[%s] [%s] Error while deleting service %s: %v`, user.Username, appName, service, err)
			}
		}
	}
}

func (a *App) startServices(ctx context.Context, services map[string]*deployedService) error {
	for service, container := range services {
		if _, err := a.dockerApp.StartContainer(ctx, container.ID, nil); err != nil {
			return fmt.Errorf(`Error while starting service %s: %v`, service, err)
		}
	}

	return nil
}

func (a *App) inspectServices(ctx context.Context, services map[string]*deployedService, user *model.User, appName string) []*types.ContainerJSON {
	containers := make([]*types.ContainerJSON, 0, len(services))

	for service, container := range services {
		infos, err := a.dockerApp.InspectContainer(ctx, container.ID)
		if err != nil {
			log.Printf(`[%s] [%s] Error while inspecting container %s: %v`, user.Username, appName, service, err)
		} else {
			containers = append(containers, infos)
		}
	}

	return containers
}

func (a *App) areContainersHealthy(ctx context.Context, user *model.User, appName string, containers []*types.ContainerJSON) bool {
	containersIdsWithHealthcheck := commons.GetContainersIDs(commons.FilterContainers(containers, hasHealthcheck))
	if len(containersIdsWithHealthcheck) == 0 {
		return true
	}

	filtersArgs := filters.NewArgs()
	healthyStatusFilters(&filtersArgs, containersIdsWithHealthcheck)

	timeoutCtx, cancel := context.WithTimeout(ctx, DeployTimeout)
	defer cancel()

	messages, errors := a.dockerApp.Docker.Events(timeoutCtx, types.EventsOptions{Filters: filtersArgs})
	healthyContainers := make(map[string]bool, len(containersIdsWithHealthcheck))

	for {
		select {
		case <-ctx.Done():
			return false
		case message := <-messages:
			healthyContainers[message.ID] = true
			if len(healthyContainers) == len(containersIdsWithHealthcheck) {
				return true
			}
		case err := <-errors:
			log.Printf(`[%s] [%s] Error while reading healthy events: %v`, user.Username, appName, err)
			return false
		}
	}
}

func (a *App) finishDeploy(ctx context.Context, cancel context.CancelFunc, user *model.User, appName string, services map[string]*deployedService, oldContainers []types.Container) {
	defer cancel()
	defer a.tasks.Delete(appName)

	if a.areContainersHealthy(ctx, user, appName, a.inspectServices(ctx, services, user, appName)) {
		if err := a.cleanContainers(ctx, oldContainers); err != nil {
			log.Printf(`[%s] [%s] Error while cleaning old containers: %v`, user.Username, appName, err)
		}

		if err := a.renameDeployedContainers(ctx, services); err != nil {
			log.Printf(`[%s] [%s] Error while renaming deployed containers: %v`, user.Username, appName, err)
		}
	} else {
		a.deleteServices(ctx, appName, services, user)
		log.Printf(`[%s] [%s] Failed to deploy: %v`, user.Username, appName, errHealthCheckFailed)
	}
}

func (a *App) createContainer(ctx context.Context, user *model.User, appName string, serviceName string, service *dockerComposeService) (*deployedService, error) {
	imagePulled := false

	if a.tag != `` {
		imageOverride := fmt.Sprintf(`%s%s%s`, service.Image, colonSeparator, a.tag)
		if err := a.pullImage(ctx, imageOverride); err == nil {
			service.Image = imageOverride
			imagePulled = true
		}
	}

	if !imagePulled {
		if err := a.pullImage(ctx, service.Image); err != nil {
			return nil, err
		}
	}

	serviceFullName := getServiceFullName(appName, serviceName)

	config, err := a.getConfig(service, user, appName)
	if err != nil {
		return nil, fmt.Errorf(`Error while getting config: %v`, err)
	}

	createdContainer, err := a.dockerApp.Docker.ContainerCreate(ctx, config, a.getHostConfig(service, user), a.getNetworkConfig(serviceName, service), serviceFullName)
	if err != nil {
		return nil, fmt.Errorf(`Error while creating service %s: %v`, serviceName, err)
	}

	return &deployedService{ID: createdContainer.ID, Name: serviceFullName}, nil
}

func (a *App) parseCompose(ctx context.Context, user *model.User, appName string, composeFile []byte) (map[string]*deployedService, error) {
	composeFile = bytes.Replace(composeFile, []byte(`$$`), []byte(`$`), -1)

	compose := dockerCompose{}
	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		return nil, fmt.Errorf(`[%s] [%s] Error while unmarshalling compose file: %v`, user.Username, appName, err)
	}

	newServices := make(map[string]*deployedService)
	for serviceName, service := range compose.Services {
		if deployedService, err := a.createContainer(ctx, user, appName, serviceName, &service); err != nil {
			break
		} else {
			newServices[serviceName] = deployedService
		}
	}

	return newServices, nil
}

func composeFailed(w http.ResponseWriter, user *model.User, appName string, err error) {
	httperror.InternalServerError(w, fmt.Errorf(`[%s] [%s] Failed to deploy: %v`, user.Username, appName, err))
}

func (a *App) composeHandler(w http.ResponseWriter, r *http.Request, user *model.User) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	appName, composeFile, err := checkParams(r, user)
	if err != nil {
		httperror.BadRequest(w, err)
		return
	}

	ctx := r.Context()

	oldContainers, err := a.checkRights(ctx, user, appName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	newServices, err := a.parseCompose(ctx, user, appName, composeFile)
	if err != nil {
		composeFailed(w, user, appName, err)
		return
	}

	if err = a.checkTasks(user, appName); err != nil {
		composeFailed(w, user, appName, err)
		return
	}

	ctx, cancel := context.WithCancel(context.Background())
	go a.finishDeploy(ctx, cancel, user, appName, newServices, oldContainers)

	if err == nil {
		err = a.startServices(ctx, newServices)
	}

	if err != nil {
		cancel()
		composeFailed(w, user, appName, err)
		return
	}

	if err := httpjson.ResponseArrayJSON(w, http.StatusOK, newServices, httpjson.IsPretty(r.URL.RawQuery)); err != nil {
		httperror.InternalServerError(w, err)
	}
}

// Handler for request. Should be use with net/http
func (a *App) Handler() http.Handler {
	return a.authApp.Handler(a.composeHandler)
}