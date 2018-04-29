package docker

import (
	"flag"
	"fmt"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/httputils/pkg/tools"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
)

// App stores informations
type App struct {
	Docker     client.APIClient
	wsUpgrader websocket.Upgrader
}

// NewApp creates new App from Flags' config
func NewApp(config map[string]*string) (*App, error) {
	client, err := client.NewClient(*config[`host`], *config[`version`], nil, nil)
	if err != nil {
		return nil, fmt.Errorf(`Error while creating docker client: %v`, err)
	}

	return &App{
		Docker: client,
	}, nil
}

// Flags adds flags for given prefix
func Flags(prefix string) map[string]*string {
	return map[string]*string{
		`host`:    flag.String(tools.ToCamel(fmt.Sprintf(`%sHost`, prefix)), `unix:///var/run/docker.sock`, `[docker] Host`),
		`version`: flag.String(tools.ToCamel(fmt.Sprintf(`%sVersion`, prefix)), ``, `[docker] API Version`),
	}
}

// LabelFilters add filter for given user
func LabelFilters(user *model.User, filtersArgs *filters.Args, appName string) {
	if appName != `` && isMultiApp(user) {
		filtersArgs.Add(`label`, fmt.Sprintf(`%s=%s`, commons.AppLabel, appName))
	} else if !IsAdmin(user) {
		filtersArgs.Add(`label`, fmt.Sprintf(`%s=%s`, commons.OwnerLabel, user.Username))
	}
}

// EventFilters add filter for wanted events
func EventFilters(filtersArgs *filters.Args) {
	filtersArgs.Add(`event`, `create`)
	filtersArgs.Add(`event`, `start`)
	filtersArgs.Add(`event`, `stop`)
	filtersArgs.Add(`event`, `restart`)
	filtersArgs.Add(`event`, `rename`)
	filtersArgs.Add(`event`, `update`)
	filtersArgs.Add(`event`, `destroy`)
	filtersArgs.Add(`event`, `die`)
	filtersArgs.Add(`event`, `kill`)
}
