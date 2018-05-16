package api

import (
	"net/http"
	"strings"

	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/dashboard/pkg/deploy"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/httputils/pkg/httperror"
)

const (
	healthPath       = `/health`
	containersPrefix = `/containers`
	deployPrefix     = `/deploy`
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
	containerHandler := http.StripPrefix(containersPrefix, a.dockerApp.Handler())
	deployHandler := http.StripPrefix(deployPrefix, a.deployApp.Handler())

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			if _, err := w.Write(nil); err != nil {
				httperror.InternalServerError(w, err)
			}
			return
		}

		if r.URL.Path == healthPath && r.Method == http.MethodGet {
			a.healthHandler(w, r)
			return
		}

		if strings.HasPrefix(r.URL.Path, containersPrefix) {
			containerHandler.ServeHTTP(w, r)
			return
		}

		if strings.HasPrefix(r.URL.Path, deployPrefix) {
			deployHandler.ServeHTTP(w, r)
			return
		}

		httperror.NotFound(w)
	})
}

func (a *App) healthHandler(w http.ResponseWriter, r *http.Request) {
	if a.dockerApp == nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}

	if !a.dockerApp.Healthcheck() {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}

	w.WriteHeader(http.StatusOK)
}
