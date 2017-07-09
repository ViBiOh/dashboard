package docker

import (
	"fmt"
	"log"
	"os"
	"regexp"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
)

const host = `DOCKER_HOST`
const version = `DOCKER_VERSION`

var hostCheck *regexp.Regexp
var docker *client.Client

// Init docker
func Init(websocketOrigin string) {
	client, err := client.NewClient(os.Getenv(host), os.Getenv(version), nil, nil)

	if err != nil {
		log.Fatal(err)
	} else {
		docker = client
	}

	hostCheck = regexp.MustCompile(websocketOrigin)
}

func labelFilters(filtersArgs *filters.Args, user *auth.User, appName *string) error {
	if appName != nil && *appName != `` && isMultiApp(user) {
		if _, err := filters.ParseFlag(`label=`+appLabel+`=`+*appName, *filtersArgs); err != nil {
			return fmt.Errorf(`[%s] Error while parsing label for label=%s=%s: %v`, user.Username, appLabel, *appName, err)
		}
	} else if !isAdmin(user) {
		if _, err := filters.ParseFlag(`label=`+ownerLabel+`=`+user.Username, *filtersArgs); err != nil {
			return fmt.Errorf(`[%s] Error while parsing label for label=%s=%s: %v`, user.Username, ownerLabel, user.Username, err)
		}
	}

	return nil
}

func healthyStatusFilters(user *auth.User, filtersArgs *filters.Args, containersIds []*string) error {
	if _, err := filters.ParseFlag(`event=health_status: healthy`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=health_status: healthy: %v`, user.Username, err)
	}

	for _, container := range containersIds {
		if _, err := filters.ParseFlag(`container=`+*container, *filtersArgs); err != nil {
			return fmt.Errorf(`[%s] Error while parsing label for container=%s: %v`, user.Username, *container, err)
		}
	}

	return nil
}

func eventFilters(filtersArgs *filters.Args) error {
	if _, err := filters.ParseFlag(`event=create`, *filtersArgs); err != nil {
		return fmt.Errorf(`[] Error while parsing label for event=create: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=start`, *filtersArgs); err != nil {
		return fmt.Errorf(`[] Error while parsing label for event=start: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=stop`, *filtersArgs); err != nil {
		return fmt.Errorf(`[] Error while parsing label for event=stop: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=restart`, *filtersArgs); err != nil {
		return fmt.Errorf(`[] Error while parsing label for event=restart: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=rename`, *filtersArgs); err != nil {
		return fmt.Errorf(`[] Error while parsing label for event=rename: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=update`, *filtersArgs); err != nil {
		return fmt.Errorf(`[] Error while parsing label for event=update: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=destroy`, *filtersArgs); err != nil {
		return fmt.Errorf(`[] Error while parsing label for event=destroy: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=die`, *filtersArgs); err != nil {
		return fmt.Errorf(`[] Error while parsing label for event=die: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=kill`, *filtersArgs); err != nil {
		return fmt.Errorf(`[] Error while parsing label for event=kill: %v`, err)
	}

	return nil
}
