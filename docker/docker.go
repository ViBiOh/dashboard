package docker

import (
	"bufio"
	"bytes"
	"context"
	"github.com/ViBiOh/docker-deploy/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
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
var listRequest = regexp.MustCompile(`/containers/?$`)
var startRequest = regexp.MustCompile(`/containers/(\S*)/start`)
var stopRequest = regexp.MustCompile(`/containers/(\S*)/stop`)
var restartRequest = regexp.MustCompile(`/containers/(\S*)/restart`)
var logRequest = regexp.MustCompile(`/containers/(\S*)/logs`)

type results struct {
	Results interface{} `json:"results"`
}

type user struct {
	username string
	password string
}

var docker *client.Client
var users map[string]*user

func handleError(w http.ResponseWriter, err error) {
	log.Print(err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
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
		user := user{string(parts[0]), string(parts[1])}

		users[strings.ToLower(user.username)] = &user
	}

	return users
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

func startContainer(w http.ResponseWriter, containerID []byte) {
	err := docker.ContainerStart(context.Background(), string(containerID), types.ContainerStartOptions{})
	if err != nil {
		handleError(w, err)
		return
	}

	w.Write(nil)
}

func stopContainer(w http.ResponseWriter, containerID []byte) {
	err := docker.ContainerStop(context.Background(), string(containerID), nil)
	if err != nil {
		handleError(w, err)
		return
	}

	w.Write(nil)
}

func restartContainer(w http.ResponseWriter, containerID []byte) {
	err := docker.ContainerRestart(context.Background(), string(containerID), nil)
	if err != nil {
		handleError(w, err)
		return
	}

	w.Write(nil)
}

func logContainer(w http.ResponseWriter, containerID []byte) {
	logs, err := docker.ContainerLogs(context.Background(), string(containerID), types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true})
	if err != nil {
		handleError(w, err)
		return
	}

	defer logs.Close()
	logsBytes, err := ioutil.ReadAll(logs)
	if err != nil {
		handleError(w, err)
		return
	}

	w.Write(logsBytes)
}

func listContainers(w http.ResponseWriter) {
	if containers, err := docker.ContainerList(context.Background(), types.ContainerListOptions{}); err != nil {
		handleError(w, err)
	} else {
		jsonHttp.ResponseJSON(w, results{containers})
	}
}

func isAuthenticated(r *http.Request) bool {
	username, password, ok := r.BasicAuth()

	if ok {
		user, ok := users[strings.ToLower(username)]

		if ok && user.password == password {
			return true
		}
	}

	return false
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

	if listRequest.Match(urlPath) && r.Method == http.MethodGet {
		listContainers(w)
	} else if isAuthenticated(r) {
		if startRequest.Match(urlPath) && r.Method == http.MethodPost {
			startContainer(w, startRequest.FindSubmatch(urlPath)[1])
		} else if stopRequest.Match(urlPath) && r.Method == http.MethodPost {
			stopContainer(w, stopRequest.FindSubmatch(urlPath)[1])
		} else if restartRequest.Match(urlPath) && r.Method == http.MethodPost {
			restartContainer(w, restartRequest.FindSubmatch(urlPath)[1])
		} else if logRequest.Match(urlPath) && r.Method == http.MethodGet {
			logContainer(w, logRequest.FindSubmatch(urlPath)[1])
		}
	} else {
		unauthorized(w)
	}
}
