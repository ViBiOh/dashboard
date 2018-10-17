package main

import (
	"errors"
	"flag"
	"net/http"
	"strings"
	"time"

	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/dashboard/pkg/api"
	"github.com/ViBiOh/dashboard/pkg/deploy"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/dashboard/pkg/stream"
	"github.com/ViBiOh/httputils/pkg"
	"github.com/ViBiOh/httputils/pkg/alcotest"
	"github.com/ViBiOh/httputils/pkg/cors"
	"github.com/ViBiOh/httputils/pkg/gzip"
	"github.com/ViBiOh/httputils/pkg/healthcheck"
	"github.com/ViBiOh/httputils/pkg/logger"
	"github.com/ViBiOh/httputils/pkg/opentracing"
	"github.com/ViBiOh/httputils/pkg/owasp"
	"github.com/ViBiOh/httputils/pkg/rollbar"
	"github.com/ViBiOh/httputils/pkg/server"
	"github.com/ViBiOh/mailer/pkg/client"
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
			return errors.New(`timeout exceeded for graceful close`)
		}
	}
}

func main() {
	serverConfig := httputils.Flags(``)
	alcotestConfig := alcotest.Flags(``)
	opentracingConfig := opentracing.Flags(`tracing`)
	owaspConfig := owasp.Flags(``)
	corsConfig := cors.Flags(`cors`)
	rollbarConfig := rollbar.Flags(`rollbar`)

	authConfig := auth.Flags(`auth`)
	dockerConfig := docker.Flags(`docker`)
	deployConfig := deploy.Flags(`docker`)
	streamConfig := stream.Flags(`docker`)
	mailerConfig := client.Flags(`mailer`)

	flag.Parse()

	alcotest.DoAndExit(alcotestConfig)

	serverApp := httputils.NewApp(serverConfig)
	healthcheckApp := healthcheck.NewApp()
	opentracingApp := opentracing.NewApp(opentracingConfig)
	owaspApp := owasp.NewApp(owaspConfig)
	corsApp := cors.NewApp(corsConfig)
	rollbarApp := rollbar.NewApp(rollbarConfig)
	gzipApp := gzip.NewApp()

	authApp := auth.NewApp(authConfig, nil)
	dockerApp, err := docker.NewApp(dockerConfig, authApp)
	if err != nil {
		logger.Fatal(`error while creating docker: %v`, err)
	}

	streamApp, err := stream.NewApp(streamConfig, authApp, dockerApp)
	if err != nil {
		logger.Fatal(`error while creating stream: %v`, err)
	}

	mailerApp := client.NewApp(mailerConfig)
	deployApp := deploy.NewApp(deployConfig, authApp, dockerApp, mailerApp)
	apiApp := api.NewApp(authApp, dockerApp, deployApp)

	restHandler := server.ChainMiddlewares(apiApp.Handler(), opentracingApp, rollbarApp, gzipApp, owaspApp, corsApp)
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
	}, healthcheckApp, rollbarApp)
}
