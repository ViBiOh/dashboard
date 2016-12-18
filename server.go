package main

import (
	"context"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"log"
	"os"
	"runtime"
)

const host = `DOCKER_HOST`
const version = `DOCKER_VERSION`

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	docker, err := client.NewClient(os.Getenv(host), os.Getenv(version), nil, nil)
	if err != nil {
		log.Fatal(err)
	}

	containers, err := docker.ContainerList(context.Background(), types.ContainerListOptions{})
	if err != nil {
		log.Fatal(err)
	}

	for _, container := range containers {
		log.Printf(`%s %s\n`, container.ID[:10], container.Image)
	}
}
