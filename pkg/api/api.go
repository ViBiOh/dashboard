package api

import (
	"net/http"
	"regexp"
	"strings"

	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/dashboard/pkg/deploy"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/httputils/pkg/httperror"
)

const (
	healthPrefix     = `/health`
	containersPrefix = `/containers`
)

var (
	containerRequest       = regexp.MustCompile(`^/([^/]+)/?$`)
	containerActionRequest = regexp.MustCompile(`^/([^/]+)/([^/]+)`)
)

// App stores informations
type App struct {
	authApp   *auth.App
	dockerApp *docker.App
	deployApp *deploy.App
}

// NewApp creates new App from dependencies
func NewApp(authApp *auth.App, dockerApp *docker.App, deployApp *deploy.App) *App {
	return &App{
		authApp:   authApp,
		dockerApp: dockerApp,
		deployApp: deployApp,
	}
}

// Handler for Docker request. Should be use with net/http
func (a *App) Handler() http.Handler {
	authHandler := a.authApp.Handler(func(w http.ResponseWriter, r *http.Request, user *model.User) {
		if strings.HasPrefix(r.URL.Path, containersPrefix) {
			a.containersHandler(w, r, strings.TrimPrefix(r.URL.Path, containersPrefix), user)
		}
	})

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			if _, err := w.Write(nil); err != nil {
				httperror.InternalServerError(w, err)
			}
			return
		}

		if strings.HasPrefix(r.URL.Path, healthPrefix) && r.Method == http.MethodGet {
			a.healthHandler(w, r)
			return
		}

		if r.Method == http.MethodGet && (r.URL.Path == `/` || r.URL.Path == ``) {
			http.ServeFile(w, r, `doc/api.html`)
			return
		}

		authHandler.ServeHTTP(w, r)
	})
}

func (a *App) healthHandler(w http.ResponseWriter, r *http.Request) {
	if a.dockerApp != nil {
		ctx, cancel := commons.GetCtx()
		defer cancel()

		if _, err := a.dockerApp.Docker.Ping(ctx); err == nil {
			w.WriteHeader(http.StatusOK)
			return
		}
	}

	w.WriteHeader(http.StatusServiceUnavailable)
}

func (a *App) containersHandler(w http.ResponseWriter, r *http.Request, urlPath string, user *model.User) {
	if r.Method == http.MethodGet && (urlPath == `/` || urlPath == ``) {
		a.dockerApp.ListContainersHandler(w, r, user)
	} else if containerRequest.MatchString(urlPath) {
		containerID := containerRequest.FindStringSubmatch(urlPath)[1]

		if r.Method == http.MethodGet {
			a.dockerApp.BasicActionHandler(w, r, user, containerID, docker.GetAction)
		} else if r.Method == http.MethodDelete {
			a.dockerApp.BasicActionHandler(w, r, user, containerID, docker.DeleteAction)
		} else if r.Method == http.MethodPost {
			a.deployApp.ComposeHandler(w, r, user)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	} else if containerActionRequest.MatchString(urlPath) && r.Method == http.MethodPost {
		matches := containerActionRequest.FindStringSubmatch(urlPath)
		a.dockerApp.BasicActionHandler(w, r, user, matches[1], matches[2])
	} else {
		httperror.NotFound(w)
	}
}
