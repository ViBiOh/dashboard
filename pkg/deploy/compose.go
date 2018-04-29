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
	network       string
	tag           string
	containerUser string
}

// NewApp creates new App from Flags' config
func NewApp(config map[string]*string, dockerApp *docker.App) *App {
	return &App{
		tasks:         sync.Map{},
		dockerApp:     dockerApp,
		network:       *config[`network`],
		tag:           *config[`tag`],
		containerUser: *config[`containerUser`],
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

	if healthcheck.Interval != `` {
		interval, err := time.ParseDuration(healthcheck.Interval)
		if err != nil {
			return nil, fmt.Errorf(`Error while parsing healthcheck interval: %v`, err)
		}

		healthconfig.Interval = interval
	}

	if healthcheck.Timeout != `` {
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

func (a *App) pullImage(image string) error {
	if !strings.Contains(image, colonSeparator) {
		image = fmt.Sprintf(`%s%s%s`, image, colonSeparator, a.tag)
	}

	ctx, cancel := getGracefulCtx()
	defer cancel()

	pull, err := a.dockerApp.Docker.ImagePull(ctx, image, types.ImagePullOptions{})
	if err != nil {
		return fmt.Errorf(`Error while pulling image: %v`, err)
	}

	_, err = request.ReadBody(pull)
	return err
}

func (a *App) cleanContainers(containers []types.Container) error {
	for _, container := range containers {
		if _, err := a.dockerApp.StopContainer(container.ID, nil); err != nil {
			return fmt.Errorf(`Error while stopping container %s: %v`, container.Names, err)
		}
	}

	for _, container := range containers {
		if _, err := a.dockerApp.RmContainer(container.ID, nil, false); err != nil {
			return fmt.Errorf(`Error while deleting container %s: %v`, container.Names, err)
		}
	}

	return nil
}

func (a *App) renameDeployedContainers(containers map[string]*deployedService) error {
	ctx, cancel := commons.GetCtx()
	defer cancel()

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

func (a *App) logServiceOutput(user *model.User, appName string, service *deployedService) {
	ctx, _ := commons.GetCtx()
	logs, err := a.dockerApp.Docker.ContainerLogs(ctx, service.ID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: false})
	if logs != nil {
		defer func() {
			if err := logs.Close(); err != nil {
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

func (a *App) deleteServices(appName string, services map[string]*deployedService, user *model.User) {
	for service, container := range services {
		a.logServiceOutput(user, appName, container)

		infos, err := a.dockerApp.InspectContainer(container.ID)
		if err != nil {
			log.Printf(`[%s] [%s] Error while inspecting service %s: %v`, user.Username, appName, service, err)
		} else {
			logServiceHealth(user, appName, container, infos)

			if _, err := a.dockerApp.StopContainer(container.ID, infos); err != nil {
				log.Printf(`[%s] [%s] Error while stopping service %s: %v`, user.Username, appName, service, err)
			}

			if _, err := a.dockerApp.RmContainer(container.ID, infos, true); err != nil {
				log.Printf(`[%s] [%s] Error while deleting service %s: %v`, user.Username, appName, service, err)
			}
		}
	}
}

func (a *App) startServices(services map[string]*deployedService) error {
	for service, container := range services {
		if _, err := a.dockerApp.StartContainer(container.ID, nil); err != nil {
			return fmt.Errorf(`Error while starting service %s: %v`, service, err)
		}
	}

	return nil
}

func (a *App) inspectServices(services map[string]*deployedService, user *model.User, appName string) []*types.ContainerJSON {
	containers := make([]*types.ContainerJSON, 0, len(services))

	for service, container := range services {
		infos, err := a.dockerApp.InspectContainer(container.ID)
		if err != nil {
			log.Printf(`[%s] [%s] Error while inspecting container %s: %v`, user.Username, appName, service, err)
		} else {
			containers = append(containers, infos)
		}
	}

	return containers
}

func (a *App) areContainersHealthy(ctx context.Context, user *model.User, appName string, containers []*types.ContainerJSON) bool {
	containersIdsWithHealthcheck := make([]string, 0, len(containers))
	for _, container := range containers {
		if container.Config.Healthcheck != nil && len(container.Config.Healthcheck.Test) != 0 {
			containersIdsWithHealthcheck = append(containersIdsWithHealthcheck, container.ID)
		}
	}

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

	if a.areContainersHealthy(ctx, user, appName, a.inspectServices(services, user, appName)) {
		if err := a.cleanContainers(oldContainers); err != nil {
			log.Printf(`[%s] [%s] Error while cleaning old containers: %v`, user.Username, appName, err)
		}

		if err := a.renameDeployedContainers(services); err != nil {
			log.Printf(`[%s] [%s] Error while renaming deployed containers: %v`, user.Username, appName, err)
		}
	} else {
		a.deleteServices(appName, services, user)
		log.Printf(`[%s] [%s] Failed to deploy: %v`, user.Username, appName, errHealthCheckFailed)
	}
}

func (a *App) createContainer(user *model.User, appName string, serviceName string, service *dockerComposeService) (*deployedService, error) {
	imagePulled := false

	if a.tag != `` {
		imageOverride := fmt.Sprintf(`%s%s%s`, service.Image, colonSeparator, a.tag)
		if err := a.pullImage(imageOverride); err == nil {
			service.Image = imageOverride
			imagePulled = true
		}
	}

	if !imagePulled {
		if err := a.pullImage(service.Image); err != nil {
			return nil, err
		}
	}

	serviceFullName := getServiceFullName(appName, serviceName)

	config, err := a.getConfig(service, user, appName)
	if err != nil {
		return nil, fmt.Errorf(`Error while getting config: %v`, err)
	}

	ctx, cancel := commons.GetCtx()
	defer cancel()

	createdContainer, err := a.dockerApp.Docker.ContainerCreate(ctx, config, a.getHostConfig(service, user), a.getNetworkConfig(serviceName, service), serviceFullName)
	if err != nil {
		return nil, fmt.Errorf(`Error while creating service %s: %v`, serviceName, err)
	}

	return &deployedService{ID: createdContainer.ID, Name: serviceFullName}, nil
}

func composeFailed(w http.ResponseWriter, user *model.User, appName string, err error) {
	httperror.InternalServerError(w, fmt.Errorf(`[%s] [%s] Failed to deploy: %v`, user.Username, appName, err))
}

// ComposeHandler handler net/http request
func (a *App) ComposeHandler(w http.ResponseWriter, r *http.Request, user *model.User, appName string, composeFile []byte) {
	if user == nil {
		httperror.BadRequest(w, commons.ErrUserRequired)
		return
	}

	if len(appName) == 0 || len(composeFile) == 0 {
		httperror.BadRequest(w, fmt.Errorf(`[%s] An application name and a compose file are required`, user.Username))
		return
	}

	oldContainers, err := a.dockerApp.ListContainers(user, appName)
	if err != nil {
		composeFailed(w, user, appName, err)
		return
	}

	if len(oldContainers) > 0 && oldContainers[0].Labels[commons.OwnerLabel] != user.Username {
		composeFailed(w, user, appName, fmt.Errorf(`[%s] [%s] Application not owned`, user.Username, appName))
		httperror.Forbidden(w)
		return
	}

	composeFile = bytes.Replace(composeFile, []byte(`$$`), []byte(`$`), -1)

	compose := dockerCompose{}
	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		httperror.BadRequest(w, fmt.Errorf(`[%s] [%s] Error while unmarshalling compose file: %v`, user.Username, appName, err))
		return
	}

	newServices := make(map[string]*deployedService)
	var deployedService *deployedService
	for serviceName, service := range compose.Services {
		if deployedService, err = a.createContainer(user, appName, serviceName, &service); err != nil {
			break
		} else {
			newServices[serviceName] = deployedService
		}
	}

	if _, ok := a.tasks.Load(appName); ok {
		composeFailed(w, user, appName, fmt.Errorf(`[%s] [%s] Application already in deployment`, user.Username, appName))
		return
	}
	a.tasks.Store(appName, true)

	ctx, cancel := context.WithCancel(context.Background())
	go a.finishDeploy(ctx, cancel, user, appName, newServices, oldContainers)

	if err == nil {
		err = a.startServices(newServices)
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
