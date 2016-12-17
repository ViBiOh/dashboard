package main

import (
	"context"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"log"
)

func main() {
	docker, err := client.NewEnvClient()
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
