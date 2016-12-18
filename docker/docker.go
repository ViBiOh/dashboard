package docker

import (
	"context"
	"github.com/ViBiOh/docker-deploy/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"log"
	"net/http"
	"os"
)

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

func listContainers() []types.Container {
	if containers, err := docker.ContainerList(context.Background(), types.ContainerListOptions{}); err == nil {
		return containers
	} else {
		log.Fatal(err)
		return nil
	}
}

// Handler for Hello request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(`Access-Control-Allow-Origin`, `*`)
	w.Header().Add(`Access-Control-Allow-Headers`, `Content-Type`)
	w.Header().Add(`Access-Control-Allow-Methods`, `GET`)
	w.Header().Add(`X-Content-Type-Options`, `nosniff`)

	jsonHttp.ResponseJSON(w, listContainers())
}
