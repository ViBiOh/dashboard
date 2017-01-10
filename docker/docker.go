package docker

import (
	"github.com/docker/docker/client"
	"log"
	"net/http"
	"os"
	"regexp"
)

var containersRequest = regexp.MustCompile(`/containers/?$`)
var containerRequest = regexp.MustCompile(`/containers/([^/]+)/?$`)
var startRequest = regexp.MustCompile(`/containers/([^/]+)/start`)
var stopRequest = regexp.MustCompile(`/containers/([^/]+)/stop`)
var restartRequest = regexp.MustCompile(`/containers/([^/]+)/restart`)
var logRequest = regexp.MustCompile(`/containers/([^/]+)/logs`)

const host = `DOCKER_HOST`
const version = `DOCKER_VERSION`

var docker *client.Client

func init() {
	client, err := client.NewClient(os.Getenv(host), os.Getenv(version), nil, nil)
	if err != nil {
		log.Fatal(err)
	} else {
		docker = client
	}
}

func handle(w http.ResponseWriter, r *http.Request, loggedUser *user) {
	urlPath := []byte(r.URL.Path)

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
		logsContainerHandler(w, logRequest.FindSubmatch(urlPath)[1])
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodPost {
		if composeBody, err := readBody(r.Body); err != nil {
			errorHandler(w, err)
		} else {
			createAppHandler(w, loggedUser, containerRequest.FindSubmatch(urlPath)[1], composeBody)
		}
	}
}
