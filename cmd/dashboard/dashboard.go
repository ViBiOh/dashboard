package main

import (
	"errors"
	"flag"
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
	"github.com/ViBiOh/httputils/pkg/alcotest"
	"github.com/ViBiOh/httputils/pkg/cors"
	"github.com/ViBiOh/httputils/pkg/healthcheck"
	"github.com/ViBiOh/httputils/pkg/opentracing"
	"github.com/ViBiOh/httputils/pkg/owasp"
	"github.com/ViBiOh/httputils/pkg/server"
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
	serverConfig := httputils.Flags(``)
	alcotestConfig := alcotest.Flags(``)
	opentracingConfig := opentracing.Flags(`tracing`)
	owaspConfig := owasp.Flags(``)
	corsConfig := cors.Flags(`cors`)

	authConfig := auth.Flags(`auth`)
	dockerConfig := docker.Flags(`docker`)
	deployConfig := deploy.Flags(`docker`)
	streamConfig := stream.Flags(`docker`)

	flag.Parse()

	alcotest.DoAndExit(alcotestConfig)

	serverApp := httputils.NewApp(serverConfig)
	healthcheckApp := healthcheck.NewApp()
	opentracingApp := opentracing.NewApp(opentracingConfig)
	owaspApp := owasp.NewApp(owaspConfig)
	corsApp := cors.NewApp(corsConfig)

	authApp := auth.NewApp(authConfig, nil)
	dockerApp, err := docker.NewApp(dockerConfig, authApp)
	if err != nil {
		log.Fatalf(`Error while creating docker: %v`, err)
	}

	streamApp, err := stream.NewApp(streamConfig, authApp, dockerApp)
	if err != nil {
		log.Fatalf(`Error while creating stream: %v`, err)
	}

	deployApp := deploy.NewApp(deployConfig, authApp, dockerApp)
	apiApp := api.NewApp(authApp, dockerApp, deployApp)

	restHandler := server.ChainMiddlewares(gziphandler.GzipHandler(apiApp.Handler()), opentracingApp, owaspApp, corsApp)
	websocketHandler := http.StripPrefix(websocketPrefix, streamApp.WebsocketHandler())

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, websocketPrefix) {
			websocketHandler.ServeHTTP(w, r)
		} else {
			restHandler.ServeHTTP(w, r)
		}
	})

	serverApp.ListenAndServe(handler, func() error {
		return handleGracefulClose(deployApp)
	}, healthcheckApp)
}
