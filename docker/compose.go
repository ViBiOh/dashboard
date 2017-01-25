package docker

import (
	"context"
	"fmt"
	"github.com/ViBiOh/docker-deploy/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/strslice"
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
const linkSeparator = `:`

var networkConfig = network.NetworkingConfig{
	EndpointsConfig: map[string]*network.EndpointSettings{
		`traefik`: &network.EndpointSettings{},
	},
}

var imageTag = regexp.MustCompile(`^\S*?:\S+$`)
var commandSplit = regexp.MustCompile(`["']([^"']+)["']|(\S+)`)

type dockerComposeService struct {
	Image       string
	Command     string
	Environment map[string]string
	Labels      map[string]string
	Links       []string
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

func getConfig(service *dockerComposeService, loggedUser *user, appName string) *container.Config {
	environments := make([]string, len(service.Environment))
	for key, value := range service.Environment {
		environments = append(environments, key+`=`+value)
	}

	if service.Labels == nil {
		service.Labels = make(map[string]string)
	}

	service.Labels[ownerLabel] = loggedUser.username
	service.Labels[appLabel] = appName

	config := container.Config{
		Image:  service.Image,
		Labels: service.Labels,
		Env:    environments,
	}

	if service.Command != `` {
		config.Cmd = strslice.StrSlice{}
		for _, args := range commandSplit.FindAllStringSubmatch(service.Command, -1) {
			config.Cmd = append(config.Cmd, args[1]+args[2])
		}
	}

	return &config
}

func getHostConfig(service *dockerComposeService, deployedServices map[string]deployedService) *container.HostConfig {
	hostConfig := container.HostConfig{
		LogConfig: container.LogConfig{Type: `json-file`, Config: map[string]string{
			`max-size`: `50m`,
		}},
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

	for _, link := range service.Links {
		linkParts := strings.Split(link, linkSeparator)

		target := linkParts[0]
		if linkedService, ok := deployedServices[linkParts[0]]; ok {
			target = linkedService.Name
		}

		alias := linkParts[0]
		if len(linkParts) > 1 {
			alias = linkParts[1]
		}

		hostConfig.Links = append(hostConfig.Links, target+linkSeparator+alias)
	}

	return &hostConfig
}

func pullImage(image string, loggedUser *user) error {
	if !imageTag.MatchString(image) {
		image = image + defaultTag
	}

	log.Print(loggedUser.username + ` starts pulling for ` + image)
	pull, err := docker.ImagePull(context.Background(), image, types.ImagePullOptions{})
	if err != nil {
		return fmt.Errorf(`Error while pulling image: %v`, err)
	}

	readBody(pull)
	log.Print(loggedUser.username + ` ends pulling for ` + image)
	return nil
}

func cleanContainers(containers *[]types.Container, loggedUser *user) {
	for _, container := range *containers {
		log.Print(loggedUser.username + ` stops ` + strings.Join(container.Names, `, `))
		stopContainer(container.ID)
		log.Print(loggedUser.username + ` rm ` + strings.Join(container.Names, `, `))
		rmContainer(container.ID)
	}
}

func renameDeployedContainers(containers *map[string]deployedService) error {
	for _, service := range *containers {
		if err := docker.ContainerRename(context.Background(), service.ID, strings.TrimSuffix(service.Name, deploySuffix)); err != nil {
			return fmt.Errorf(`Error while renaming container %s: %v`, service.Name, err)
		}
	}

	return nil
}

func getServiceFullName(appName string, serviceName string) string {
	return appName + `_` + serviceName + deploySuffix
}

func createAppHandler(w http.ResponseWriter, loggedUser *user, appName []byte, composeFile []byte) {
	if len(appName) == 0 || len(composeFile) == 0 {
		http.Error(w, `An application name and a compose file are required`, http.StatusBadRequest)
		return
	}

	compose := dockerCompose{}
	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		errorHandler(w, fmt.Errorf(`Error while unmarshalling compose file: %v`, err))
		return
	}

	appNameStr := string(appName)
	log.Print(loggedUser.username + ` deploys ` + appNameStr)

	ownerContainers, err := listContainers(loggedUser, &appNameStr)
	if err != nil {
		errorHandler(w, err)
		return
	}

	deployedServices := make(map[string]deployedService)
	for serviceName, service := range compose.Services {
		if err := pullImage(service.Image, loggedUser); err != nil {
			errorHandler(w, err)
			return
		}

		serviceFullName := getServiceFullName(appNameStr, serviceName)
		log.Print(loggedUser.username + ` starts ` + serviceFullName)

		id, err := docker.ContainerCreate(context.Background(), getConfig(&service, loggedUser, appNameStr), getHostConfig(&service, deployedServices), &networkConfig, serviceFullName)
		if err != nil {
			errorHandler(w, fmt.Errorf(`Error while creating container: %v`, err))
			return
		}

		startContainer(id.ID)
		deployedServices[serviceName] = deployedService{ID: id.ID, Name: serviceFullName}
	}

	log.Print(`Waiting 5 seconds for containers to start...`)
	time.Sleep(5 * time.Second)

	cleanContainers(&ownerContainers, loggedUser)
	if err := renameDeployedContainers(&deployedServices); err != nil {
		errorHandler(w, err)
		return
	}

	jsonHttp.ResponseJSON(w, results{deployedServices})
}
