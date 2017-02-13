package docker

import (
	"github.com/docker/docker/client"
	"log"
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
