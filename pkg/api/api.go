package api

import (
	"net/http"
	"strings"

	"github.com/ViBiOh/dashboard/pkg/deploy"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/httputils/pkg/httperror"
)

const (
	containersPrefix = `/containers`
	deployPrefix     = `/deploy`
)

// App of package
type App struct {
	dockerApp *docker.App
	deployApp *deploy.App
}

// New creates new App
func New(dockerApp *docker.App, deployApp *deploy.App) *App {
	return &App{
		dockerApp: dockerApp,
		deployApp: deployApp,
	}
}

// Handler for Docker request. Should be use with net/http
func (a App) Handler() http.Handler {
	containerHandler := http.StripPrefix(containersPrefix, a.dockerApp.Handler())
	deployHandler := http.StripPrefix(deployPrefix, a.deployApp.Handler())

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			if _, err := w.Write(nil); err != nil {
				httperror.InternalServerError(w, err)
			}
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

// HealthcheckHandler for Healthcheck request. Should be use with net/http
func (a App) HealthcheckHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if a.dockerApp == nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}

		if !a.dockerApp.Healthcheck() {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}

		w.WriteHeader(http.StatusOK)
	})
}
