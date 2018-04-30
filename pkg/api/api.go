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
	healthPrefix     = `/health`
	containersPrefix = `/containers`
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
	deployHandler := http.StripPrefix(containersPrefix, a.deployApp.Handler())

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

		if strings.HasPrefix(r.URL.Path, containersPrefix) {
			if r.Method == http.MethodPost {
				deployHandler.ServeHTTP(w, r)
			} else {
				containerHandler.ServeHTTP(w, r)
			}

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
