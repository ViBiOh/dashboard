package docker

import (
	"bufio"
	"bytes"
	"context"
	"github.com/ViBiOh/docker-deploy/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
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

func inspectContainerHandler(w http.ResponseWriter, containerID []byte) {
	if container, err := docker.ContainerInspect(context.Background(), string(containerID)); err != nil {
		errorHandler(w, err)
	} else {
		jsonHttp.ResponseJSON(w, container)
	}
}

func startContainer(containerID string) error {
	return docker.ContainerStart(context.Background(), string(containerID), types.ContainerStartOptions{})
}

func startContainerHandler(w http.ResponseWriter, containerID []byte) {
	if err := startContainer(string(containerID)); err != nil {
		errorHandler(w, err)
	} else {
		w.Write(nil)
	}
}

func stopContainerHandler(w http.ResponseWriter, containerID []byte) {
	if err := docker.ContainerStop(context.Background(), string(containerID), nil); err != nil {
		errorHandler(w, err)
	} else {
		w.Write(nil)
	}
}

func restartContainerHandler(w http.ResponseWriter, containerID []byte) {
	if err := docker.ContainerRestart(context.Background(), string(containerID), nil); err != nil {
		errorHandler(w, err)
	} else {
		w.Write(nil)
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

func listContainersHandler(w http.ResponseWriter) {
	if containers, err := docker.ContainerList(context.Background(), types.ContainerListOptions{All: true}); err != nil {
		errorHandler(w, err)
	} else {
		jsonHttp.ResponseJSON(w, results{containers})
	}
}

func readBody(body io.ReadCloser) ([]byte, error) {
	defer body.Close()
	return ioutil.ReadAll(body)
}

func getConfig(service *dockerComposeService, loggedUser *user) *container.Config {
	environments := make([]string, len(service.Environment))
	for key, value := range service.Environment {
		environments = append(environments, key+`=`+value)
	}
	
	service.Labels[`owner`] = loggedUser.username

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
			Memory:    134217728,
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
		hostConfig.Resources.Memory = service.MemoryLimit
	}

	return &hostConfig
}

func runComposeHandler(w http.ResponseWriter, loggedUser *user, name []byte, composeFile []byte) {
	compose := dockerCompose{}

	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		errorHandler(w, err)
		return
	}

	ids := make([]string, len(compose.Services))
	for serviceName, service := range compose.Services {
		pull, err := docker.ImagePull(context.Background(), service.Image, types.ImagePullOptions{})
		defer pull.Close();
		if err != nil {
			errorHandler(w, err)
			return
		}

		id, err := docker.ContainerCreate(context.Background(), getConfig(&service, loggedUser), getHostConfig(&service), &networkConfig, string(name)+`_`+serviceName)
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

// Handler for Hello request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(`Access-Control-Allow-Origin`, `*`)
	w.Header().Add(`Access-Control-Allow-Headers`, `Content-Type, Authorization`)
	w.Header().Add(`Access-Control-Allow-Methods`, `GET, POST`)
	w.Header().Add(`X-Content-Type-Options`, `nosniff`)

	if r.Method == http.MethodOptions {
		w.Write(nil)
		return
	}

	urlPath := []byte(r.URL.Path)

	if containersRequest.Match(urlPath) && r.Method == http.MethodGet {
		listContainersHandler(w)
	} else if loggedUser := isAuthenticated(r); loggedUser!= nil {
		if containerRequest.Match(urlPath) && r.Method == http.MethodPost {
			if composeBody, err := readBody(r.Body); err != nil {
				errorHandler(w, err)
			} else {
				runComposeHandler(w, loggedUser, containerRequest.FindSubmatch(urlPath)[1], composeBody)
			}
		} else if containerRequest.Match(urlPath) && r.Method == http.MethodGet {
			inspectContainerHandler(w, containerRequest.FindSubmatch(urlPath)[1])
		} else if startRequest.Match(urlPath) && r.Method == http.MethodPost {
			startContainerHandler(w, startRequest.FindSubmatch(urlPath)[1])
		} else if stopRequest.Match(urlPath) && r.Method == http.MethodPost {
			stopContainerHandler(w, stopRequest.FindSubmatch(urlPath)[1])
		} else if restartRequest.Match(urlPath) && r.Method == http.MethodPost {
			restartContainerHandler(w, restartRequest.FindSubmatch(urlPath)[1])
		} else if logRequest.Match(urlPath) && r.Method == http.MethodGet {
			logContainerHandler(w, logRequest.FindSubmatch(urlPath)[1])
		}
	} else {
		unauthorized(w)
	}
}
