package docker

import (
	"context"
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
)

const minMemory = 67108864
const maxMemory = 536870912
const defaultTag = `:latest`
const deploySuffix = `_deploy`

var networkConfig = network.NetworkingConfig{
	EndpointsConfig: map[string]*network.EndpointSettings{
		`traefik`: &network.EndpointSettings{},
	},
}

var imageTag = regexp.MustCompile(`^\S*?:\S+$`)

type dockerComposeService struct {
	Image       string
	Command     string
	Environment map[string]string
	Labels      map[string]string
	ReadOnly    bool  `yaml:"read_only"`
	CPUShares   int64 `yaml:"cpu_shares"`
	MemoryLimit int64 `yaml:"mem_limit"`
}

type dockerCompose struct {
	Version  string
	Services map[string]dockerComposeService
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
		config.Cmd = strslice.StrSlice([]string{service.Command})
	}

	return &config
}

func getHostConfig(service *dockerComposeService) *container.HostConfig {
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
		if service.MemoryLimit < maxMemory {
			hostConfig.Resources.Memory = service.MemoryLimit
		} else {
			hostConfig.Resources.Memory = maxMemory
		}
	}

	return &hostConfig
}

func createAppHandler(w http.ResponseWriter, loggedUser *user, appName []byte, composeFile []byte) {
	if len(appName) == 0 || len(composeFile) == 0 {
		http.Error(w, `An application name and a compose file are required`, http.StatusBadRequest)
		return
	}

	compose := dockerCompose{}
	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		errorHandler(w, err)
		return
	}

	appNameStr := string(appName)
	log.Print(loggedUser.username + ` deploys ` + appNameStr)

	ownerContainers, err := listContainers(loggedUser, &appNameStr)
	if err != nil {
		errorHandler(w, err)
		return
	}

	ids := make(map[string]string)
	for serviceName, service := range compose.Services {
		image := service.Image
		if !imageTag.MatchString(image) {
			image = image + defaultTag
		}

		log.Print(loggedUser.username + ` starts pulling for ` + image)
		pull, err := docker.ImagePull(context.Background(), image, types.ImagePullOptions{})
		if err != nil {
			errorHandler(w, err)
			return
		}

		readBody(pull)
		log.Print(loggedUser.username + ` ends pulling for ` + image)

		serviceFullName := appNameStr + `_` + serviceName + deploySuffix
		log.Print(loggedUser.username + ` starts ` + serviceFullName)
		id, err := docker.ContainerCreate(context.Background(), getConfig(&service, loggedUser, appNameStr), getHostConfig(&service), &networkConfig, serviceFullName)
		if err != nil {
			errorHandler(w, err)
			return
		}

		startContainer(id.ID)
		ids[id.ID] = serviceFullName
	}

	for _, container := range ownerContainers {
		log.Print(loggedUser.username + ` stops ` + strings.Join(container.Names, `, `))
		stopContainer(container.ID)
		log.Print(loggedUser.username + ` rm ` + strings.Join(container.Names, `, `))
		rmContainer(container.ID)
	}

	for id, name := range ids {
		if err := docker.ContainerRename(context.Background(), id, strings.TrimSuffix(name, deploySuffix)); err != nil {
			errorHandler(w, err)
			return
		}
	}

	jsonHttp.ResponseJSON(w, results{ids})
}
