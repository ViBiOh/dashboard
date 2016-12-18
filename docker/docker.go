package docker

import (
	"context"
	"github.com/ViBiOh/docker-deploy/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"log"
	"net/http"
	"os"
	"regexp"
)

const host = `DOCKER_HOST`
const version = `DOCKER_VERSION`

var containersRequest = regexp.MustCompile(`^/containers$`)

type results struct {
	Results interface{} `json:"results"`
}

var docker *client.Client

func init() {
	client, err := client.NewClient(os.Getenv(host), os.Getenv(version), nil, nil)
	if err != nil {
		log.Fatal(err)
	} else {
		docker = client
	}
}

func listContainers() []types.Container {
	containers, err := docker.ContainerList(context.Background(), types.ContainerListOptions{})
	if err != nil {
		log.Fatal(err)
		return nil
	}

	return containers
}

func containersHandler(w http.ResponseWriter) {
	jsonHttp.ResponseJSON(w, results{listContainers()})
}

func isAuthenticated(r *http.Request) bool {
	_, _, ok := r.BasicAuth()
	return ok
}

func authHandler(w http.ResponseWriter) {
	http.Error(w, `Authentication required`, 401)
}

// Handler for Hello request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(`Access-Control-Allow-Origin`, `*`)
	w.Header().Add(`Access-Control-Allow-Headers`, `Content-Type`)
	w.Header().Add(`Access-Control-Allow-Methods`, `GET, POST`)
	w.Header().Add(`X-Content-Type-Options`, `nosniff`)

	urlPath := []byte(r.URL.Path)

	if containersRequest.Match(urlPath) && r.Method == http.MethodGet {
		containersHandler(w)
	} else if isAuthenticated(r) {
		jsonHttp.ResponseJSON(w, results{listContainers()})
	} else {
		authHandler(w)
	}
}
