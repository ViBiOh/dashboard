package docker

import (
	"context"
	"fmt"
	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/dashboard/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/network"
	"gopkg.in/yaml.v2"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"
)

const minMemory = 16777216
const maxMemory = 805306368
const defaultTag = `:latest`
const deploySuffix = `_deploy`
const networkMode = `traefik`
const linkSeparator = `:`
const healthcheckTimeout = 5 * time.Minute

var imageTag = regexp.MustCompile(`^\S*?:\S+$`)

type dockerComposeService struct {
	Image       string
	Command     []string
	Environment map[string]string
	Labels      map[string]string
	Links       []string
	Ports       []string
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

func getConfig(service *dockerComposeService, user *auth.User, appName string) *container.Config {
	environments := make([]string, len(service.Environment))
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

	return &config
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
		hostConfig.ReadonlyRootfs = service.ReadOnly
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

func getNetworkConfig(service *dockerComposeService, deployedServices map[string]deployedService) *network.NetworkingConfig {
	traefikConfig := network.EndpointSettings{}

	for _, link := range service.Links {
		linkParts := strings.Split(link, linkSeparator)

		target := linkParts[0]
		if linkedService, ok := (deployedServices)[target]; ok {
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

	log.Printf(`[%s] Starting pull of image %s`, user.Username, image)
	pull, err := docker.ImagePull(context.Background(), image, types.ImagePullOptions{})
	if err != nil {
		return fmt.Errorf(`[%s] Error while pulling image: %v`, user.Username, err)
	}

	readBody(pull)
	log.Printf(`[%s] Ending pull of image %s`, user.Username, image)
	return nil
}

func cleanContainers(containers []types.Container, user *auth.User) {
	for _, container := range containers {
		log.Printf(`[%s] Stopping containers %s`, user.Username, strings.Join(container.Names, `, `))
		stopContainer(container.ID)
	}

	for _, container := range containers {
		log.Printf(`[%s] Deleting containers %s`, user.Username, strings.Join(container.Names, `, `))
		rmContainer(container.ID)
	}
}

func renameDeployedContainers(containers map[string]deployedService, user *auth.User) error {
	for service, container := range containers {
		if err := docker.ContainerRename(context.Background(), container.ID, getFinalName(container.Name)); err != nil {
			return fmt.Errorf(`[%s] Error while renaming container %s: %v`, user.Username, service, err)
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

func deleteServices(appName []byte, services map[string]deployedService, user *auth.User) {
	log.Printf(`[%s] Deleting services for %s`, user.Username, appName)
	for service, container := range services {
		if err := stopContainer(container.ID); err != nil {
			log.Printf(`[%s] Error while stopping service %s for %s: %v`, user.Username, service, appName, err)
		}

		if err := rmContainer(container.ID); err != nil {
			log.Printf(`[%s] Error while deleting service %s for %s: %v`, user.Username, service, appName, err)
		}
	}
}

func startServices(appName []byte, services map[string]deployedService, user *auth.User) error {
	log.Printf(`[%s] Starting services for %s`, user.Username, appName)
	for service, container := range services {
		if err := startContainer(container.ID); err != nil {
			return fmt.Errorf(`[%s] Error while starting service %s for %s: %v`, user.Username, service, appName, err)
		}
	}

	return nil
}

func inspectServices(services map[string]deployedService, user *auth.User) []*types.ContainerJSON {
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
	containersIdsWithHealthcheck := make([]*string, 0, len(containers))
	for _, container := range containers {
		if container.Config.Healthcheck != nil && len(container.Config.Healthcheck.Test) != 0 {
			containersIdsWithHealthcheck = append(containersIdsWithHealthcheck, &container.ID)
		}
	}

	if len(containersIdsWithHealthcheck) == 0 {
		return true
	}

	filtersArgs := filters.NewArgs()
	if err := healthyStatusFilters(user, &filtersArgs, containersIdsWithHealthcheck); err != nil {
		log.Printf(`[%s] Error while defining healthy filters: %v`, user.Username, err)
		return true
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, healthcheckTimeout)
	defer cancel()

	messages, errors := docker.Events(timeoutCtx, types.EventsOptions{Filters: filtersArgs})
	healthyContainers := make(map[string]bool, len(containersIdsWithHealthcheck))

	for {
		select {
		case <-ctx.Done():
			return false
		case message := <-messages:
			healthyContainers[message.ID] = true
			log.Printf(`[%s] Container %s for %s is healthy`, user.Username, appName, message.From)

			if len(healthyContainers) == len(containersIdsWithHealthcheck) {
				return true
			}
		case err := <-errors:
			log.Printf(`[%s] Error while reading healthy events: %v`, user.Username, err)
			return false
		}
	}
}

func finishDeploy(ctx context.Context, cancel context.CancelFunc, user *auth.User, appName []byte, services map[string]deployedService, oldContainers []types.Container) {
	addCounter(1)
	defer addCounter(-1)
	defer cancel()

	log.Printf(`[%s] Waiting for %s to start...`, user.Username, appName)

	if areContainersHealthy(ctx, user, appName, inspectServices(services, user)) {
		log.Printf(`[%s] Health check succeeded for %s`, user.Username, appName)
		cleanContainers(oldContainers, user)

		if err := renameDeployedContainers(services, user); err != nil {
			log.Print(err)
		}
		log.Printf(`[%s] Succeeded to deploy %s`, user.Username, appName)
	} else {
		log.Printf(`[%s] Health check failed for %s`, user.Username, appName)
		deleteServices(appName, services, user)
		log.Printf(`[%s] Failed to deploy %s`, user.Username, appName)
	}
}

func createContainer(user *auth.User, appName []byte, serviceName string, services map[string]deployedService, service *dockerComposeService) (*deployedService, error) {
	if err := pullImage(service.Image, user); err != nil {
		return nil, err
	}

	serviceFullName := getServiceFullName(string(appName), serviceName)
	log.Printf(`[%s] Creating service %s for %s`, user.Username, serviceName, appName)

	createdContainer, err := docker.ContainerCreate(context.Background(), getConfig(service, user, string(appName)), getHostConfig(service), getNetworkConfig(service, services), serviceFullName)
	if err != nil {
		err = fmt.Errorf(`[%s] Error while creating service %s for %s: %v`, user.Username, serviceName, appName, err)
		return nil, err
	}

	return &deployedService{ID: createdContainer.ID, Name: serviceFullName}, nil
}

func composeHandler(w http.ResponseWriter, user *auth.User, appName []byte, composeFile []byte) {
	if len(appName) == 0 || len(composeFile) == 0 {
		badRequest(w, fmt.Errorf(`[%s] An application name and a compose file are required`, user.Username))
		return
	}

	compose := dockerCompose{}
	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		errorHandler(w, fmt.Errorf(`[%s] Error while unmarshalling compose file: %v`, user.Username, err))
		return
	}

	appNameStr := string(appName)
	log.Printf(`[%s] Deploying %s`, user.Username, appName)

	oldContainers, err := listContainers(user, &appNameStr)
	if err != nil {
		errorHandler(w, err)
		log.Printf(`[%s] Failed to deploy %s: %v`, user.Username, appName, err)
		return
	}

	if len(oldContainers) > 0 && oldContainers[0].Labels[ownerLabel] != user.Username {
		forbidden(w)
	}

	newServices := make(map[string]deployedService)
	for serviceName, service := range compose.Services {
		if deployedService, err := createContainer(user, appName, serviceName, newServices, &service); err != nil {
			break
		} else {
			newServices[serviceName] = *deployedService
		}
	}

	ctx, cancel := context.WithCancel(context.Background())
	go finishDeploy(ctx, cancel, user, appName, newServices, oldContainers)

	if err == nil {
		err = startServices(appName, newServices, user)
	}

	if err != nil {
		deleteServices(appName, newServices, user)
		errorHandler(w, err)
		cancel()
		log.Printf(`[%s] Failed to deploy %s: %v`, user.Username, appName, err)
		return
	}

	jsonHttp.ResponseJSON(w, results{newServices})
}
