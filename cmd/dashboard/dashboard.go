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
	"github.com/ViBiOh/httputils/pkg/datadog"
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
	datadogConfig := datadog.Flags(`datadog`)

	var deployApp *deploy.App

	httputils.NewApp(httputils.Flags(``), func() http.Handler {
		authApp := auth.NewApp(authConfig, nil)

		dockerApp, err := docker.NewApp(dockerConfig)
		if err != nil {
			log.Fatalf(`Error while creating docker: %v`, err)
		}

		deployApp = deploy.NewApp(deployConfig, dockerApp)
		streamApp, err := stream.NewApp(streamConfig, authApp, dockerApp)
		if err != nil {
			log.Fatalf(`Error while creating stream: %v`, err)
		}

		apiApp := api.NewApp(authApp, dockerApp, deployApp)

		restHandler := datadog.NewApp(datadogConfig).Handler(gziphandler.GzipHandler(owasp.Handler(owaspConfig, cors.Handler(corsConfig, apiApp.Handler()))))
		websocketHandler := http.StripPrefix(websocketPrefix, streamApp.WebsocketHandler())

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, websocketPrefix) {
				websocketHandler.ServeHTTP(w, r)
			} else {
				restHandler.ServeHTTP(w, r)
			}
		})
	}, func() error {
		return handleGracefulClose(deployApp)
	}).ListenAndServe()
}
