package docker

import (
	"flag"
	"fmt"
	"net/http"
	"regexp"

	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/httputils/pkg/tools"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
)

const (
	ownerLabel = `owner`
	appLabel   = `app`
)

// App stores informations
type App struct {
	docker        client.APIClient
	authApp       *auth.App
	wsUpgrader    websocket.Upgrader
	network       string
	tag           string
	containerUser string
}

// NewApp creates new App from Flags' config
func NewApp(config map[string]*string, authAppDep *auth.App) (*App, error) {
	client, err := client.NewClient(*config[`host`], *config[`version`], nil, nil)
	if err != nil {
		return nil, fmt.Errorf(`Error while creating docker client: %v`, err)
	}

	hostCheck, err := regexp.Compile(*config[`websocketOrigin`])
	if err != nil {
		return nil, fmt.Errorf(`Error while compiling websocket regexp: %v`, err)
	}

	return &App{
		docker:  client,
		authApp: authAppDep,
		wsUpgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return hostCheck.MatchString(r.Host)
			},
		},
		network:       *config[`network`],
		tag:           *config[`tag`],
		containerUser: *config[`containerUser`],
	}, nil
}

// Flags adds flags for given prefix
func Flags(prefix string) map[string]*string {
	return map[string]*string{
		`host`:            flag.String(tools.ToCamel(fmt.Sprintf(`%sHost`, prefix)), `unix:///var/run/docker.sock`, `[docker] Host`),
		`version`:         flag.String(tools.ToCamel(fmt.Sprintf(`%sVersion`, prefix)), ``, `[docker] API Version`),
		`network`:         flag.String(tools.ToCamel(fmt.Sprintf(`%sNetwork`, prefix)), `traefik`, `[docker] Network for deploying containers`),
		`tag`:             flag.String(tools.ToCamel(fmt.Sprintf(`%sTag`, prefix)), ``, `[docker] Tag to append to image when not provided (e.g. arm, arm64, latest, etc)`),
		`containerUser`:   flag.String(tools.ToCamel(fmt.Sprintf(`%sContainerUser`, prefix)), `1000`, `[docker] Default container user`),
		`websocketOrigin`: flag.String(tools.ToCamel(fmt.Sprintf(`%sWs`, prefix)), `^dashboard`, `[docker] Allowed WebSocket Origin pattern`),
	}
}

func labelFilters(user *model.User, filtersArgs *filters.Args, appName string) {
	if appName != `` && isMultiApp(user) {
		filtersArgs.Add(`label`, fmt.Sprintf(`%s=%s`, appLabel, appName))
	} else if !isAdmin(user) {
		filtersArgs.Add(`label`, fmt.Sprintf(`%s=%s`, ownerLabel, user.Username))
	}
}

func healthyStatusFilters(filtersArgs *filters.Args, containersIds []string) {
	filtersArgs.Add(`event`, `health_status: healthy`)

	for _, container := range containersIds {
		filtersArgs.Add(`container`, container)
	}
}

func eventFilters(filtersArgs *filters.Args) {
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
