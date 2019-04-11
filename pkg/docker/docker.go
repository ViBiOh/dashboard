package docker

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"regexp"

	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/httputils/pkg/errors"
	"github.com/ViBiOh/httputils/pkg/httperror"
	"github.com/ViBiOh/httputils/pkg/tools"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
)

var (
	containerRequest       = regexp.MustCompile("^/([^/]+)/?$")
	containerActionRequest = regexp.MustCompile("^/([^/]+)/([^/]+)")
)

// Config of package
type Config struct {
	host    *string
	version *string
}

// App of package
type App struct {
	Docker     client.APIClient
	wsUpgrader websocket.Upgrader
}

// Flags adds flags for configuring package
func Flags(fs *flag.FlagSet, prefix string) Config {
	return Config{
		host:    fs.String(tools.ToCamel(fmt.Sprintf("%sHost", prefix)), "unix:///var/run/docker.sock", "[docker] Host"),
		version: fs.String(tools.ToCamel(fmt.Sprintf("%sVersion", prefix)), "", "[docker] API Version"),
	}
}

// New creates new App from Config
func New(config Config) (*App, error) {
	client, err := client.NewClient(*config.host, *config.version, nil, nil)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return &App{
		Docker: client,
	}, nil
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

// Handler for request. Should be use with net/http
func (a *App) Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := auth.UserFromContext(r.Context())
		if user == nil {
			httperror.BadRequest(w, errors.New("user not provided"))
			return
		}

		if r.Method == http.MethodGet && (r.URL.Path == "/" || r.URL.Path == "") {
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
	})
}
