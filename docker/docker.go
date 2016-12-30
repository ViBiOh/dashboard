package docker

import (
	"bufio"
	"bytes"
	"context"
	"github.com/ViBiOh/docker-deploy/jsonHttp"
	"github.com/docker/docker/api/types"
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

func inspectContainer(w http.ResponseWriter, containerID []byte) {
	if container, err := docker.ContainerInspect(context.Background(), string(containerID)); err != nil {
		handleError(w, err)
	} else {
		jsonHttp.ResponseJSON(w, container)
	}
}

func startContainer(w http.ResponseWriter, containerID []byte) {
	if err := docker.ContainerStart(context.Background(), string(containerID), types.ContainerStartOptions{}); err != nil {
		handleError(w, err)
	} else {
		w.Write(nil)
	}
}

func stopContainer(w http.ResponseWriter, containerID []byte) {
	if err := docker.ContainerStop(context.Background(), string(containerID), nil); err != nil {
		handleError(w, err)
	} else {
		w.Write(nil)
	}
}

func restartContainer(w http.ResponseWriter, containerID []byte) {
	if err := docker.ContainerRestart(context.Background(), string(containerID), nil); err != nil {
		handleError(w, err)
	} else {
		w.Write(nil)
	}
}

func logContainer(w http.ResponseWriter, containerID []byte) {
	logs, err := docker.ContainerLogs(context.Background(), string(containerID), types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: false})
	if err != nil {
		handleError(w, err)
		return
	}

	defer logs.Close()

	if logLines, err := ioutil.ReadAll(logs); err != nil {
		handleError(w, err)
	} else {
		matches := splitLogs.FindAllSubmatch(logLines, -1)
		cleanLogs := make([]string, 0, len(matches))
		for _, match := range matches {
			cleanLogs = append(cleanLogs, string(match[1]))
		}

		jsonHttp.ResponseJSON(w, results{cleanLogs})
	}
}

func listContainers(w http.ResponseWriter) {
	if containers, err := docker.ContainerList(context.Background(), types.ContainerListOptions{}); err != nil {
		handleError(w, err)
	} else {
		jsonHttp.ResponseJSON(w, results{containers})
	}
}

func readBody(body io.ReadCloser) ([]byte, error) {
	defer body.Close()
	return ioutil.ReadAll(body)
}

func runCompose(w http.ResponseWriter, composeFile []byte) {
	compose := make(map[interface{}]interface{})

	if err := yaml.Unmarshal(composeFile, &compose); err != nil {
		log.Print(string(composeFile))
		handleError(w, err)
	} else {
		log.Print(compose)
		w.Write([]byte(`done`))
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

	if containersRequest.Match(urlPath) && r.Method == http.MethodGet {
		listContainers(w)
	} else if isAuthenticated(r) {
		if containersRequest.Match(urlPath) && r.Method == http.MethodPost {
			if composeBody, err := readBody(r.Body); err != nil {
				handleError(w, err)
			} else {
				runCompose(w, composeBody)
			}
		} else if containerRequest.Match(urlPath) && r.Method == http.MethodGet {
			inspectContainer(w, containerRequest.FindSubmatch(urlPath)[1])
		} else if startRequest.Match(urlPath) && r.Method == http.MethodPost {
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
