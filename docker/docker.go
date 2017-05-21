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

func labelFilters(filtersArgs *filters.Args, loggedUser *user, appName *string) error {
	if !isAdmin(loggedUser) && !isMultiApp(loggedUser) {
		if _, err := filters.ParseFlag(`label=`+ownerLabel+`=`+loggedUser.username, *filtersArgs); err != nil {
			return fmt.Errorf(`Error while parsing label for user: %v`, err)
		}
	} else if appName != nil && *appName != `` {
		if _, err := filters.ParseFlag(`label=`+appLabel+`=`+*appName, *filtersArgs); err != nil {
			return fmt.Errorf(`Error while parsing label for user: %v`, err)
		}
	}

	return nil
}

func eventFilters(filtersArgs *filters.Args) error {
	if _, err := filters.ParseFlag(`event=create`, *filtersArgs); err != nil {
		return fmt.Errorf(`Error while parsing label for user: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=start`, *filtersArgs); err != nil {
		return fmt.Errorf(`Error while parsing label for user: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=stop`, *filtersArgs); err != nil {
		return fmt.Errorf(`Error while parsing label for user: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=restart`, *filtersArgs); err != nil {
		return fmt.Errorf(`Error while parsing label for user: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=rename`, *filtersArgs); err != nil {
		return fmt.Errorf(`Error while parsing label for user: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=update`, *filtersArgs); err != nil {
		return fmt.Errorf(`Error while parsing label for user: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=destroy`, *filtersArgs); err != nil {
		return fmt.Errorf(`Error while parsing label for user: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=die`, *filtersArgs); err != nil {
		return fmt.Errorf(`Error while parsing label for user: %v`, err)
	}
	if _, err := filters.ParseFlag(`event=kill`, *filtersArgs); err != nil {
		return fmt.Errorf(`Error while parsing label for user: %v`, err)
	}

	return nil
}
