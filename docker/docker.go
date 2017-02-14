package docker

import (
	"fmt"
	"github.com/docker/docker/api/types/filters"
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

func labelFilter(loggedUser *user, appName *string) (*filters.Args, error) {
	labelFilter := filters.NewArgs()
	
	if !isAdmin(loggedUser) {
		if _, err := filters.ParseFlag(`label=`+ownerLabel+`=`+loggedUser.username, labelFilter); err != nil {
			return nil, fmt.Errorf(`Error while parsing label for user: %v`, err)
		}
	} else if appName != nil && *appName != `` {
		if _, err := filters.ParseFlag(`label=`+appLabel+`=`+*appName, labelFilter); err != nil {
			return nil, fmt.Errorf(`Error while parsing label for user: %v`, err)
		}
	}
	
	return &labelFilter, nil
}
