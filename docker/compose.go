package docker

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	yaml "gopkg.in/yaml.v2"

	"github.com/ViBiOh/auth/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/network"
)

const defaultCPUShares = 128
const minMemory = 16777216
const maxMemory = 805306368
const colonSeparator = `:`
const defaultTag = `:latest`
const deploySuffix = `_deploy`

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

func getConfig(service *dockerComposeService, user *auth.User, appName string) (*container.Config, error) {
	environments := make([]string, 0, len(service.Environment))
	for key, value := range service.Environment {
		environments = append(environments, key+`=`+value)
	}

	if service.Labels == nil {
		service.Labels = make(map[string]string)
	}

	service.Labels[ownerLabel] = user.Username
	service.Labels[appLabel] = appName

	config := container.Config{
		Hostname: service.Hostname,
		Image:    service.Image,
		Labels:   service.Labels,
		Env:      environments,
		User:     service.User,
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

		if len(parts) > 1 && parts[0] != `/` {
			volume := mount.Mount{Source: parts[0], Target: parts[1]}
			if len(parts) > 2 && parts[2] == `ro` {
				volume.ReadOnly = true
			}

			hostConfig.Mounts = append(hostConfig.Mounts, volume)
			hostConfig.Binds = append(hostConfig.Binds, rawVolume)
		}
	}
}

func getHostConfig(service *dockerComposeService, user *auth.User) *container.HostConfig {
	hostConfig := container.HostConfig{
		LogConfig: container.LogConfig{Type: `json-file`, Config: map[string]string{
			`max-size`: `10m`,
		}},
		NetworkMode:   container.NetworkMode(*dockerNetwork),
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

	if isAdmin(user) && len(service.Volumes) > 0 {
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

		settings.Links = append(settings.Links, target+colonSeparator+alias)
	}
}

func getNetworkConfig(serviceName string, service *dockerComposeService) *network.NetworkingConfig {
	endpointConfig := network.EndpointSettings{}
	endpointConfig.Aliases = append(endpointConfig.Aliases, serviceName)

	addLinks(&endpointConfig, service.Links)
	addLinks(&endpointConfig, service.ExternalLinks)

	return &network.NetworkingConfig{
		EndpointsConfig: map[string]*network.EndpointSettings{
			*dockerNetwork: &endpointConfig,
		},
	}
}

func pullImage(image string) error {
	if !strings.Contains(image, colonSeparator) {
		image = image + defaultTag
	}

	ctx, cancel := getGracefulCtx()
	defer cancel()

	pull, err := docker.ImagePull(ctx, image, types.ImagePullOptions{})
	if err != nil {
		return fmt.Errorf(`Error while pulling image: %v`, err)
	}

	httputils.ReadBody(pull)
	return nil
}

func cleanContainers(containers []types.Container) error {
	for _, container := range containers {
		if _, err := stopContainer(container.ID, nil); err != nil {
			return fmt.Errorf(`Error while stopping container %s: %v`, container.Names, err)
		}
	}

	for _, container := range containers {
		if _, err := rmContainer(container.ID, nil, false); err != nil {
			return fmt.Errorf(`Error while deleting container %s: %v`, container.Names, err)
		}
	}

	return nil
}

func renameDeployedContainers(containers map[string]*deployedService) error {
	ctx, cancel := getCtx()
	defer cancel()

	for service, container := range containers {
		if err := docker.ContainerRename(ctx, container.ID, getFinalName(container.Name)); err != nil {
			return fmt.Errorf(`Error while renaming container %s: %v`, service, err)
		}
	}

	return nil
}

func getServiceFullName(app string, service string) string {
	return app + `_` + service + deploySuffix
}

func getFinalName(serviceFullName string) string {
	return strings.TrimSuffix(serviceFullName, deploySuffix)
}

func logServiceOutput(user *auth.User, appName string, service *deployedService) {
	ctx, _ := getCtx()
	logs, err := docker.ContainerLogs(ctx, service.ID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: false})
	if logs != nil {
		defer logs.Close()
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
		if len(logLine) > ignoredByteLogSize {
			logsContent = append(logsContent, string(logLine[ignoredByteLogSize:]))
			logsContent = append(logsContent, "\n")
		}
	}

	log.Printf(`[%s] [%s] Logs output for %s: %s`, user.Username, appName, service.Name, logsContent)
}

func logServiceHealth(user *auth.User, appName string, service *deployedService, infos *types.ContainerJSON) {
	if infos.State.Health != nil {
		inspectOutput := make([]string, 0)
		inspectOutput = append(inspectOutput, "\n")

		for _, log := range infos.State.Health.Log {
			inspectOutput = append(inspectOutput, log.Output)
		}

		log.Printf(`[%s] [%s] Healthcheck output for %s: %s`, user.Username, appName, service.Name, inspectOutput)
	}
}

func deleteServices(appName string, services map[string]*deployedService, user *auth.User) {
	for service, container := range services {
		logServiceOutput(user, appName, container)

		infos, err := inspectContainer(container.ID)
		if err != nil {
			log.Printf(`[%s] [%s] Error while inspecting service %s: %v`, user.Username, appName, service, err)
		} else {
			logServiceHealth(user, appName, container, infos)

			if _, err := stopContainer(container.ID, infos); err != nil {
				log.Printf(`[%s] [%s] Error while stopping service %s: %v`, user.Username, appName, service, err)
			}

			if _, err := rmContainer(container.ID, infos, true); err != nil {
				log.Printf(`[%s] [%s] Error while deleting service %s: %v`, user.Username, appName, service, err)
			}
		}
	}
}

func startServices(services map[string]*deployedService) error {
	for service, container := range services {
		if _, err := startContainer(container.ID, nil); err != nil {
			return fmt.Errorf(`Error while starting service %s: %v`, service, err)
		}
	}

	return nil
}

func inspectServices(services map[string]*deployedService, user *auth.User, appName string) []*types.ContainerJSON {
	containers := make([]*types.ContainerJSON, 0, len(services))

	for service, container := range services {
		infos, err := inspectContainer(container.ID)
		if err != nil {
			log.Printf(`[%s] [%s] Error while inspecting container %s: %v`, user.Username, appName, service, err)
		} else {
			containers = append(containers, infos)
		}
	}

	return containers
}

func areContainersHealthy(ctx context.Context, user *auth.User, appName string, containers []*types.ContainerJSON) bool {
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

	messages, errors := docker.Events(timeoutCtx, types.EventsOptions{Filters: filtersArgs})
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

func finishDeploy(ctx context.Context, cancel context.CancelFunc, user *auth.User, appName string, services map[string]*deployedService, oldContainers []types.Container) {
	defer cancel()
	defer backgroundTasks.Delete(appName)

	if areContainersHealthy(ctx, user, appName, inspectServices(services, user, appName)) {
		if err := cleanContainers(oldContainers); err != nil {
			log.Printf(`[%s] [%s] Error while cleaning old containers: %v`, user.Username, appName, err)
		}

		if err := renameDeployedContainers(services); err != nil {
			log.Printf(`[%s] [%s] Error while renaming deployed containers: %v`, user.Username, appName, err)
		}
	} else {
		deleteServices(appName, services, user)
		log.Printf(`[%s] [%s] Failed to deploy: %v`, user.Username, appName, fmt.Errorf(`Health check failed`))
	}
}

func createContainer(user *auth.User, appName string, serviceName string, service *dockerComposeService) (*deployedService, error) {
	if err := pullImage(service.Image); err != nil {
		return nil, err
	}

	serviceFullName := getServiceFullName(appName, serviceName)

	config, err := getConfig(service, user, appName)
	if err != nil {
		return nil, fmt.Errorf(`Error while getting config: %v`, err)
	}

	ctx, cancel := getCtx()
	defer cancel()

	createdContainer, err := docker.ContainerCreate(ctx, config, getHostConfig(service, user), getNetworkConfig(serviceName, service), serviceFullName)
	if err != nil {
		return nil, fmt.Errorf(`Error while creating service %s: %v`, serviceName, err)
	}

	return &deployedService{ID: createdContainer.ID, Name: serviceFullName}, nil
}

func composeFailed(w http.ResponseWriter, user *auth.User, appName string, err error) {
	httputils.InternalServerError(w, fmt.Errorf(`[%s] [%s] Failed to deploy: %v`, user.Username, appName, err))
}

func composeHandler(w http.ResponseWriter, r *http.Request, user *auth.User, appName string, composeFile []byte) {
	if user == nil {
		httputils.BadRequest(w, fmt.Errorf(`A user is required`))
		return
	}

	if len(appName) == 0 || len(composeFile) == 0 {
		httputils.BadRequest(w, fmt.Errorf(`[%s] An application name and a compose file are required`, user.Username))
		return
	}

	composeFile = bytes.Replace(composeFile, []byte(`$$`), []byte(`$`), -1)

	compose := dockerCompose{}
	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		httputils.BadRequest(w, fmt.Errorf(`[%s] [%s] Error while unmarshalling compose file: %v`, user.Username, appName, err))
		return
	}

	if _, ok := backgroundTasks.Load(appName); ok {
		composeFailed(w, user, appName, fmt.Errorf(`[%s] [%s] Application already in deployment`, user.Username, appName))
		return
	}
	backgroundTasks.Store(appName, true)

	oldContainers, err := listContainers(user, appName)
	if err != nil {
		composeFailed(w, user, appName, err)
		return
	}

	if len(oldContainers) > 0 && oldContainers[0].Labels[ownerLabel] != user.Username {
		composeFailed(w, user, appName, fmt.Errorf(`[%s] [%s] Application not owned`, user.Username, appName))
		httputils.Forbidden(w)
	}

	newServices := make(map[string]*deployedService)
	var deployedService *deployedService
	for serviceName, service := range compose.Services {
		if deployedService, err = createContainer(user, appName, serviceName, &service); err != nil {
			break
		} else {
			newServices[serviceName] = deployedService
		}
	}

	ctx, cancel := context.WithCancel(context.Background())
	go finishDeploy(ctx, cancel, user, appName, newServices, oldContainers)

	if err == nil {
		err = startServices(newServices)
	}

	if err != nil {
		cancel()
		composeFailed(w, user, appName, err)
	} else {
		httputils.ResponseArrayJSON(w, http.StatusOK, newServices, httputils.IsPretty(r.URL.RawQuery))
	}
}
