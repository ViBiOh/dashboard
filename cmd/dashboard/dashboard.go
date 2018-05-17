package main

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/dashboard/pkg/api"
	"github.com/ViBiOh/dashboard/pkg/deploy"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/dashboard/pkg/stream"
	"github.com/ViBiOh/httputils/pkg"
	"github.com/ViBiOh/httputils/pkg/cors"
	"github.com/ViBiOh/httputils/pkg/healthcheck"
	"github.com/ViBiOh/httputils/pkg/owasp"
)

const websocketPrefix = `/ws`

func handleGracefulClose(deployApp *deploy.App) error {
	if deployApp.CanBeGracefullyClosed() {
		return nil
	}

	ticker := time.Tick(15 * time.Second)
	timeout := time.After(deploy.DeployTimeout)

	for {
		select {
		case <-ticker:
			if deployApp.CanBeGracefullyClosed() {
				return nil
			}
		case <-timeout:
			return errors.New(`Timeout exceeded for graceful close`)
		}
	}
}

func main() {
	authConfig := auth.Flags(`auth`)
	owaspConfig := owasp.Flags(``)
	corsConfig := cors.Flags(`cors`)
	dockerConfig := docker.Flags(`docker`)
	deployConfig := deploy.Flags(`docker`)
	streamConfig := stream.Flags(`docker`)

	var deployApp *deploy.App
	healthcheckApp := healthcheck.NewApp()

	httputils.NewApp(httputils.Flags(``), func() http.Handler {
		authApp := auth.NewApp(authConfig, nil)

		dockerApp, err := docker.NewApp(dockerConfig, authApp)
		if err != nil {
			log.Fatalf(`Error while creating docker: %v`, err)
		}

		streamApp, err := stream.NewApp(streamConfig, authApp, dockerApp)
		if err != nil {
			log.Fatalf(`Error while creating stream: %v`, err)
		}

		deployApp = deploy.NewApp(deployConfig, authApp, dockerApp)
		apiApp := api.NewApp(authApp, dockerApp, deployApp)

		restHandler := gziphandler.GzipHandler(owasp.Handler(owaspConfig, cors.Handler(corsConfig, apiApp.Handler())))
		websocketHandler := http.StripPrefix(websocketPrefix, streamApp.WebsocketHandler())
		healthcheckHandler := healthcheckApp.Handler(apiApp.HealthcheckHandler())

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == `/health` {
				healthcheckHandler.ServeHTTP(w, r)
			} else if strings.HasPrefix(r.URL.Path, websocketPrefix) {
				websocketHandler.ServeHTTP(w, r)
			} else {
				restHandler.ServeHTTP(w, r)
			}
		})
	}, func() error {
		return handleGracefulClose(deployApp)
	}, healthcheckApp).ListenAndServe()
}
