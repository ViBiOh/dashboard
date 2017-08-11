package docker

import (
	"flag"
	"fmt"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
)

const ownerLabel = `owner`
const appLabel = `app`

var docker *client.Client

var (
	dockerHost    = flag.String(`dockerHost`, `unix:///var/run/docker.sock`, `Docker Host`)
	dockerVersion = flag.String(`dockerVersion`, ``, `Docker API Version`)
)

// Init docker client
func Init() error {
	client, err := client.NewClient(*dockerHost, *dockerVersion, nil, nil)
	if err != nil {
		return fmt.Errorf(`Error while creating docker client: %v`, err)
	}
	docker = client

	if err := InitWebsocket(); err != nil {
		return fmt.Errorf(`Error while initializing websocket: %v`, err)
	}

	return nil
}

func labelFilters(user *auth.User, filtersArgs *filters.Args, appName string) error {
	if user == nil {
		return fmt.Errorf(`Unable to add label filters without user`)
	}

	if appName != `` && isMultiApp(user) {
		if _, err := filters.ParseFlag(`label=`+appLabel+`=`+appName, *filtersArgs); err != nil {
			return fmt.Errorf(`[%s] Error while parsing label for label=%s=%s: %v`, user.Username, appLabel, appName, err)
		}
	} else if !isAdmin(user) {
		if _, err := filters.ParseFlag(`label=`+ownerLabel+`=`+user.Username, *filtersArgs); err != nil {
			return fmt.Errorf(`[%s] Error while parsing label for label=%s=%s: %v`, user.Username, ownerLabel, user.Username, err)
		}
	}

	return nil
}

func healthyStatusFilters(user *auth.User, filtersArgs *filters.Args, containersIds []string) error {
	if _, err := filters.ParseFlag(`event=health_status: healthy`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=health_status: healthy: %v`, user.Username, err)
	}

	for _, container := range containersIds {
		if _, err := filters.ParseFlag(`container=`+container, *filtersArgs); err != nil {
			return fmt.Errorf(`[%s] Error while parsing label for container=%s: %v`, user.Username, container, err)
		}
	}

	return nil
}

func eventFilters(user *auth.User, filtersArgs *filters.Args) error {
	if _, err := filters.ParseFlag(`event=create`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=create: %v`, user.Username, err)
	}
	if _, err := filters.ParseFlag(`event=start`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=start: %v`, user.Username, err)
	}
	if _, err := filters.ParseFlag(`event=stop`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=stop: %v`, user.Username, err)
	}
	if _, err := filters.ParseFlag(`event=restart`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=restart: %v`, user.Username, err)
	}
	if _, err := filters.ParseFlag(`event=rename`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=rename: %v`, user.Username, err)
	}
	if _, err := filters.ParseFlag(`event=update`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=update: %v`, user.Username, err)
	}
	if _, err := filters.ParseFlag(`event=destroy`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=destroy: %v`, user.Username, err)
	}
	if _, err := filters.ParseFlag(`event=die`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=die: %v`, user.Username, err)
	}
	if _, err := filters.ParseFlag(`event=kill`, *filtersArgs); err != nil {
		return fmt.Errorf(`[%s] Error while parsing label for event=kill: %v`, user.Username, err)
	}

	return nil
}
