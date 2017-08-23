package docker

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	yaml "gopkg.in/yaml.v2"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/network"
)

const minMemory = 16777216
const maxMemory = 805306368
const defaultTag = `:latest`
const deploySuffix = `_deploy`
const networkMode = `traefik`
const linkSeparator = `:`

var imageTag = regexp.MustCompile(`^\S*?:\S+$`)

type dockerComposeHealthcheck struct {
	Test     []string
	Interval string
	Timeout  string
	Retries  int
}

type dockerComposeService struct {
	Image       string
	Command     []string
	Environment map[string]string
	Labels      map[string]string
	Links       []string
	Ports       []string
	Healthcheck *dockerComposeHealthcheck
	ReadOnly    bool  `yaml:"read_only"`
	CPUShares   int64 `yaml:"cpu_shares"`
	MemoryLimit int64 `yaml:"mem_limit"`
}

type dockerCompose struct {
	Version  string
	Services map[string]dockerComposeService
}

type deployedService struct {
	ID   string
	Name string
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
		Image:  service.Image,
		Labels: service.Labels,
		Env:    environments,
	}

	if len(service.Command) != 0 {
		config.Cmd = service.Command
	}

	if service.Healthcheck != nil {
		healthconfig := container.HealthConfig{
			Test:    service.Healthcheck.Test,
			Retries: service.Healthcheck.Retries,
		}

		if service.Healthcheck.Interval != `` {
			interval, err := time.ParseDuration(service.Healthcheck.Interval)
			if err != nil {
				return nil, fmt.Errorf(`Error while parsing healthcheck interval: %v`, err)
			}

			healthconfig.Interval = interval
		}

		if service.Healthcheck.Timeout != `` {
			timeout, err := time.ParseDuration(service.Healthcheck.Timeout)
			if err != nil {
				return nil, fmt.Errorf(`Error while parsing healthcheck timeout: %v`, err)
			}

			healthconfig.Timeout = timeout
		}

		config.Healthcheck = &healthconfig
	}

	return &config, nil
}

func getHostConfig(service *dockerComposeService) *container.HostConfig {
	hostConfig := container.HostConfig{
		LogConfig: container.LogConfig{Type: `json-file`, Config: map[string]string{
			`max-size`: `50m`,
		}},
		NetworkMode:   networkMode,
		RestartPolicy: container.RestartPolicy{Name: `on-failure`, MaximumRetryCount: 5},
		Resources: container.Resources{
			CPUShares: 128,
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

	return &hostConfig
}

func getNetworkConfig(service *dockerComposeService, deployedServices map[string]*deployedService) *network.NetworkingConfig {
	traefikConfig := network.EndpointSettings{}

	for _, link := range service.Links {
		linkParts := strings.Split(link, linkSeparator)

		target := linkParts[0]
		if linkedService, ok := deployedServices[target]; ok {
			target = getFinalName(linkedService.Name)
		}

		alias := linkParts[0]
		if len(linkParts) > 1 {
			alias = linkParts[1]
		}

		traefikConfig.Links = append(traefikConfig.Links, target+linkSeparator+alias)
	}

	return &network.NetworkingConfig{
		EndpointsConfig: map[string]*network.EndpointSettings{
			networkMode: &traefikConfig,
		},
	}
}

func pullImage(image string, user *auth.User) error {
	if !imageTag.MatchString(image) {
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

func cleanContainers(containers []types.Container, user *auth.User) {
	for _, container := range containers {
		stopContainer(container.ID)
	}

	for _, container := range containers {
		rmContainer(container.ID)
	}
}

func renameDeployedContainers(containers map[string]*deployedService, user *auth.User) error {
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

func deleteServices(appName []byte, services map[string]*deployedService, user *auth.User) {
	for service, container := range services {
		if infos, err := inspectContainer(container.ID); err != nil {
			log.Printf(`[%s] [%s] Error while inspecting service %s: %v`, user.Username, appName, service, err)
		} else if infos.State.Health != nil {
			logs := make([]string, 0)

			logs = append(logs, "\n")
			for _, log := range infos.State.Health.Log {
				logs = append(logs, log.Output)
			}

			log.Printf(`[%s] [%s] Healthcheck output for %s: %s`, user.Username, appName, service, logs)
		}

		if err := stopContainer(container.ID); err != nil {
			log.Printf(`[%s] [%s] Error while stopping service %s: %v`, user.Username, appName, service, err)
		}

		if err := rmContainer(container.ID); err != nil {
			log.Printf(`[%s] [%s] Error while deleting service %s: %v`, user.Username, appName, service, err)
		}
	}
}

func startServices(appName []byte, services map[string]*deployedService, user *auth.User) error {
	for service, container := range services {
		if err := startContainer(container.ID); err != nil {
			return fmt.Errorf(`[%s] [%s] Error while starting service %s: %v`, user.Username, appName, service, err)
		}
	}

	return nil
}

func inspectServices(services map[string]*deployedService, user *auth.User) []*types.ContainerJSON {
	containers := make([]*types.ContainerJSON, 0, len(services))

	for service, container := range services {
		infos, err := inspectContainer(container.ID)
		if err != nil {
			log.Printf(`[%s] Error while inspecting container %s: %v`, user.Username, service, err)
		}

		containers = append(containers, &infos)
	}

	return containers
}

func areContainersHealthy(ctx context.Context, user *auth.User, appName []byte, containers []*types.ContainerJSON) bool {
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

func finishDeploy(ctx context.Context, cancel context.CancelFunc, user *auth.User, appName []byte, services map[string]*deployedService, oldContainers []types.Container) {
	defer cancel()
	defer func() {
		backgroundMutex.Lock()
		defer backgroundMutex.Unlock()

		delete(backgroundTasks, string(appName))
	}()

	if areContainersHealthy(ctx, user, appName, inspectServices(services, user)) {
		cleanContainers(oldContainers, user)

		if err := renameDeployedContainers(services, user); err != nil {
			log.Printf(`[%s] [%s] Error while renaming deployed containers: %v`, user.Username, appName, err)
		}
	} else {
		deleteServices(appName, services, user)
		log.Printf(`[%s] [%s] Failed to deploy: %v`, user.Username, appName, fmt.Errorf(`[Health check failed`))
	}
}

func createContainer(user *auth.User, appName []byte, serviceName string, services map[string]*deployedService, service *dockerComposeService) (*deployedService, error) {
	if err := pullImage(service.Image, user); err != nil {
		return nil, err
	}

	serviceFullName := getServiceFullName(string(appName), serviceName)

	config, err := getConfig(service, user, string(appName))
	if err != nil {
		return nil, fmt.Errorf(`[%s] [%s] Error while getting config: %v`, user.Username, appName, err)
	}

	ctx, cancel := getCtx()
	defer cancel()

	createdContainer, err := docker.ContainerCreate(ctx, config, getHostConfig(service), getNetworkConfig(service, services), serviceFullName)
	if err != nil {
		return nil, fmt.Errorf(`[%s] [%s] Error while creating service %s: %v`, user.Username, appName, serviceName, err)
	}

	return &deployedService{ID: createdContainer.ID, Name: serviceFullName}, nil
}

func composeFailed(w http.ResponseWriter, user *auth.User, appName []byte, err error) {
	httputils.InternalServer(w, fmt.Errorf(`[%s] [%s] Failed to deploy: %v`, user.Username, appName, err))
}

func composeHandler(w http.ResponseWriter, user *auth.User, appName []byte, composeFile []byte) {
	if user == nil {
		httputils.BadRequest(w, fmt.Errorf(`A user is required`))
		return
	}

	if len(appName) == 0 || len(composeFile) == 0 {
		httputils.BadRequest(w, fmt.Errorf(`[%s] An application name and a compose file are required`, user.Username))
		return
	}

	bytes.Replace(composeFile, []byte(`$$`), []byte(`$`), -1)

	compose := dockerCompose{}
	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		httputils.BadRequest(w, fmt.Errorf(`[%s] [%s] Error while unmarshalling compose file: %v`, user.Username, appName, err))
		return
	}

	appNameStr := string(appName)

	backgroundMutex.Lock()
	if _, ok := backgroundTasks[appNameStr]; ok {
		backgroundMutex.Unlock()
		composeFailed(w, user, appName, fmt.Errorf(`[%s] [%s] Application already in deployment`, user.Username, appName))
		return
	}

	backgroundTasks[appNameStr] = true
	backgroundMutex.Unlock()

	oldContainers, err := listContainers(user, appNameStr)
	if err != nil {
		composeFailed(w, user, appName, err)
		return
	}

	if len(oldContainers) > 0 && oldContainers[0].Labels[ownerLabel] != user.Username {
		composeFailed(w, user, appName, fmt.Errorf(`[%s] [%s] Application not owned`, user.Username, appName))
		httputils.Forbidden(w)
	}

	newServices := make(map[string]*deployedService)
	for serviceName, service := range compose.Services {
		if deployedService, err := createContainer(user, appName, serviceName, newServices, &service); err != nil {
			break
		} else {
			newServices[serviceName] = deployedService
		}
	}

	ctx, cancel := context.WithCancel(context.Background())
	go finishDeploy(ctx, cancel, user, appName, newServices, oldContainers)

	if err == nil {
		err = startServices(appName, newServices, user)
	}

	if err != nil {
		cancel()
		composeFailed(w, user, appName, err)
	} else {
		httputils.ResponseArrayJSON(w, newServices)
	}
}
