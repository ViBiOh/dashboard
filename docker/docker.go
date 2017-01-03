package docker

import (
	"bufio"
	"bytes"
	"context"
	"github.com/ViBiOh/docker-deploy/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/strslice"
	"github.com/docker/docker/client"
	"gopkg.in/yaml.v2"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
)

const host = `DOCKER_HOST`
const version = `DOCKER_VERSION`
const configurationFile = `./users`
const admin = `admin`
const ownerLabel = `owner`
const appLabel = `app`
const minMemory = 67108864
const maxMemory = 536870912

var commaByte = []byte(`,`)
var splitLogs = regexp.MustCompile(`.{8}(.*?)\n`)

var networkConfig = network.NetworkingConfig{
	EndpointsConfig: map[string]*network.EndpointSettings{
		`traefik`: &network.EndpointSettings{},
	},
}

var containersRequest = regexp.MustCompile(`/containers/?$`)
var containerRequest = regexp.MustCompile(`/containers/([^/]+)/?$`)
var startRequest = regexp.MustCompile(`/containers/([^/]+)/start`)
var stopRequest = regexp.MustCompile(`/containers/([^/]+)/stop`)
var restartRequest = regexp.MustCompile(`/containers/([^/]+)/restart`)
var logRequest = regexp.MustCompile(`/containers/([^/]+)/logs`)

type results struct {
	Results interface{} `json:"results"`
}

type user struct {
	username string
	password string
	role     string
}

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

var docker *client.Client
var users map[string]*user

func errorHandler(w http.ResponseWriter, err error) {
	log.Print(err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func init() {
	users = readConfiguration(configurationFile)

	client, err := client.NewClient(os.Getenv(host), os.Getenv(version), nil, nil)
	if err != nil {
		log.Fatal(err)
	} else {
		docker = client
	}
}

func readConfiguration(path string) map[string]*user {
	configFile, err := os.Open(path)
	defer configFile.Close()

	if err != nil {
		log.Print(err)
		return nil
	}

	users := make(map[string]*user)

	scanner := bufio.NewScanner(configFile)
	for scanner.Scan() {
		parts := bytes.Split(scanner.Bytes(), commaByte)
		user := user{string(parts[0]), string(parts[1]), string(parts[2])}

		users[strings.ToLower(user.username)] = &user
	}

	return users
}

func isAllowed(loggedUser *user, containerID string) (bool, error) {
	if loggedUser.role != admin {
		container, err := inspectContainer(string(containerID))
		if err != nil {
			return false, err
		}

		owner, ok := container.Config.Labels[ownerLabel]
		if !ok || owner != loggedUser.username {
			return false, nil
		}
	}

	return true, nil
}

func listContainers(loggedUser *user, appName *string) ([]types.Container, error) {
	options := types.ContainerListOptions{All: true}

	options.Filters = filters.NewArgs()

	if loggedUser != nil && loggedUser.role != admin {
		if _, err := filters.ParseFlag(`label=`+ownerLabel+`=`+loggedUser.username, options.Filters); err != nil {
			return nil, err
		}
	} else if appName != nil && *appName != `` {
		if _, err := filters.ParseFlag(`label=`+appLabel+`=`+*appName, options.Filters); err != nil {
			return nil, err
		}
	}

	return docker.ContainerList(context.Background(), options)
}

func inspectContainer(containerID string) (types.ContainerJSON, error) {
	return docker.ContainerInspect(context.Background(), containerID)
}

func startContainer(containerID string) error {
	return docker.ContainerStart(context.Background(), string(containerID), types.ContainerStartOptions{})
}

func stopContainer(containerID string) error {
	return docker.ContainerStop(context.Background(), containerID, nil)
}

func restartContainer(containerID string) error {
	return docker.ContainerRestart(context.Background(), containerID, nil)
}

func rmContainer(containerID string) error {
	return docker.ContainerRemove(context.Background(), containerID, types.ContainerRemoveOptions{RemoveVolumes: true, Force: true})
}

func inspectContainerHandler(w http.ResponseWriter, containerID []byte) {
	if container, err := inspectContainer(string(containerID)); err != nil {
		errorHandler(w, err)
	} else {
		jsonHttp.ResponseJSON(w, container)
	}
}

func basicActionHandler(w http.ResponseWriter, loggedUser *user, containerID []byte, handle func(string) error) {
	id := string(containerID)

	allowed, err := isAllowed(loggedUser, id)
	if !allowed {
		forbidden(w)
	} else if err != nil {
		errorHandler(w, err)
	} else {
		if err = handle(id); err != nil {
			errorHandler(w, err)
		} else {
			w.Write(nil)
		}
	}
}

func logContainerHandler(w http.ResponseWriter, containerID []byte) {
	logs, err := docker.ContainerLogs(context.Background(), string(containerID), types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: false})
	if err != nil {
		errorHandler(w, err)
		return
	}

	defer logs.Close()

	if logLines, err := ioutil.ReadAll(logs); err != nil {
		errorHandler(w, err)
	} else {
		matches := splitLogs.FindAllSubmatch(logLines, -1)
		cleanLogs := make([]string, 0, len(matches))
		for _, match := range matches {
			cleanLogs = append(cleanLogs, string(match[1]))
		}

		jsonHttp.ResponseJSON(w, results{cleanLogs})
	}
}

func listContainersHandler(w http.ResponseWriter, loggerUser *user) {
	if containers, err := listContainers(loggerUser, nil); err != nil {
		errorHandler(w, err)
	} else {
		jsonHttp.ResponseJSON(w, results{containers})
	}
}

func readBody(body io.ReadCloser) ([]byte, error) {
	defer body.Close()
	return ioutil.ReadAll(body)
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
	compose := dockerCompose{}

	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		errorHandler(w, err)
		return
	}

	appNameStr := string(appName)
	log.Print(loggedUser.username+` deploys `+appNameStr)

	ownerContainers, err := listContainers(loggedUser, &appNameStr)
	if err != nil {
		errorHandler(w, err)
		return
	}
	for _, container := range ownerContainers {
		log.Print(loggedUser.username+` stops `+container.Names)
		stopContainer(container.ID)
	}

	ids := make([]string, len(compose.Services))
	for serviceName, service := range compose.Services {
		log.Print(loggedUser.username+` pulls `+service.Image)
		pull, err := docker.ImagePull(context.Background(), service.Image, types.ImagePullOptions{})
		if err != nil {
			errorHandler(w, err)
			return
		}
	
		readBody(pull)

		log.Print(loggedUser.username+` starts `+serviceName)
		id, err := docker.ContainerCreate(context.Background(), getConfig(&service, loggedUser, appNameStr), getHostConfig(&service), &networkConfig, appNameStr+`_`+serviceName)
		if err != nil {
			errorHandler(w, err)
			return
		}

		startContainer(id.ID)
		ids = append(ids, id.ID)
	}

	jsonHttp.ResponseJSON(w, results{ids})
}

func isAuthenticated(r *http.Request) *user {
	username, password, ok := r.BasicAuth()

	if ok {
		user, ok := users[strings.ToLower(username)]

		if ok && user.password == password {
			return user
		}
	}

	return nil
}

func unauthorized(w http.ResponseWriter) {
	http.Error(w, `Authentication required`, http.StatusUnauthorized)
}

func forbidden(w http.ResponseWriter) {
	http.Error(w, `Forbidden`, http.StatusForbidden)
}

// Handler for Hello request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(`Access-Control-Allow-Origin`, `*`)
	w.Header().Add(`Access-Control-Allow-Headers`, `Content-Type, Authorization`)
	w.Header().Add(`Access-Control-Allow-Methods`, `GET, POST, DELETE`)
	w.Header().Add(`X-Content-Type-Options`, `nosniff`)

	if r.Method == http.MethodOptions {
		w.Write(nil)
		return
	}

	urlPath := []byte(r.URL.Path)

	loggedUser := isAuthenticated(r)
	if loggedUser == nil {
		unauthorized(w)
		return
	}

	if containersRequest.Match(urlPath) && r.Method == http.MethodGet {
		listContainersHandler(w, loggedUser)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodGet {
		inspectContainerHandler(w, containerRequest.FindSubmatch(urlPath)[1])
	} else if startRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, loggedUser, startRequest.FindSubmatch(urlPath)[1], startContainer)
	} else if stopRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, loggedUser, stopRequest.FindSubmatch(urlPath)[1], stopContainer)
	} else if restartRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, loggedUser, restartRequest.FindSubmatch(urlPath)[1], restartContainer)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodDelete {
		basicActionHandler(w, loggedUser, containerRequest.FindSubmatch(urlPath)[1], rmContainer)
	} else if logRequest.Match(urlPath) && r.Method == http.MethodGet {
		logContainerHandler(w, logRequest.FindSubmatch(urlPath)[1])
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodPost {
		if composeBody, err := readBody(r.Body); err != nil {
			errorHandler(w, err)
		} else {
			createAppHandler(w, loggedUser, containerRequest.FindSubmatch(urlPath)[1], composeBody)
		}
	}
}
