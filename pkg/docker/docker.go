package docker

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"regexp"

	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/httputils/pkg/httperror"
	"github.com/ViBiOh/httputils/pkg/tools"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
)

var (
	containerRequest       = regexp.MustCompile(`^/([^/]+)/?$`)
	containerActionRequest = regexp.MustCompile(`^/([^/]+)/([^/]+)`)
)

// App stores informations
type App struct {
	Docker     client.APIClient
	authApp    *auth.App
	wsUpgrader websocket.Upgrader
}

// NewApp creates new App from Flags' config
func NewApp(config map[string]*string, authApp *auth.App) (*App, error) {
	client, err := client.NewClient(*config[`host`], *config[`version`], nil, nil)
	if err != nil {
		return nil, fmt.Errorf(`Error while creating docker client: %v`, err)
	}

	return &App{
		Docker:  client,
		authApp: authApp,
	}, nil
}

// Flags adds flags for given prefix
func Flags(prefix string) map[string]*string {
	return map[string]*string{
		`host`:    flag.String(tools.ToCamel(fmt.Sprintf(`%sHost`, prefix)), `unix:///var/run/docker.sock`, `[docker] Host`),
		`version`: flag.String(tools.ToCamel(fmt.Sprintf(`%sVersion`, prefix)), ``, `[docker] API Version`),
	}
}

// Healthcheck check health of app
func (a *App) Healthcheck() bool {
	ctx, cancel := commons.GetCtx(context.Background())
	defer cancel()

	if _, err := a.Docker.Ping(ctx); err != nil {
		return false
	}
	return true
}

func (a *App) containerHandler(w http.ResponseWriter, r *http.Request, user *model.User) {
	if r.Method == http.MethodGet && (r.URL.Path == `/` || r.URL.Path == ``) {
		a.ListContainersHandler(w, r, user)
	} else if containerRequest.MatchString(r.URL.Path) {
		containerID := containerRequest.FindStringSubmatch(r.URL.Path)[1]

		if r.Method == http.MethodGet {
			a.basicActionHandler(w, r, user, containerID, getAction)
		} else if r.Method == http.MethodDelete {
			a.basicActionHandler(w, r, user, containerID, deleteAction)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	} else if containerActionRequest.MatchString(r.URL.Path) && r.Method == http.MethodPost {
		matches := containerActionRequest.FindStringSubmatch(r.URL.Path)
		a.basicActionHandler(w, r, user, matches[1], matches[2])
	} else {
		httperror.NotFound(w)
	}
}

// Handler for request. Should be use with net/http
func (a *App) Handler() http.Handler {
	return a.authApp.Handler(a.containerHandler)
}
