package main

import (
	"errors"
	"flag"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/dashboard/pkg/api"
	"github.com/ViBiOh/dashboard/pkg/deploy"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/dashboard/pkg/stream"
	httputils "github.com/ViBiOh/httputils/pkg"
	"github.com/ViBiOh/httputils/pkg/alcotest"
	"github.com/ViBiOh/httputils/pkg/cors"
	"github.com/ViBiOh/httputils/pkg/gzip"
	"github.com/ViBiOh/httputils/pkg/healthcheck"
	"github.com/ViBiOh/httputils/pkg/logger"
	"github.com/ViBiOh/httputils/pkg/opentracing"
	"github.com/ViBiOh/httputils/pkg/owasp"
	"github.com/ViBiOh/httputils/pkg/prometheus"
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
	fs := flag.NewFlagSet(`dashboard`, flag.ExitOnError)

	serverConfig := httputils.Flags(fs, ``)
	alcotestConfig := alcotest.Flags(fs, ``)
	prometheusConfig := prometheus.Flags(fs, `prometheus`)
	opentracingConfig := opentracing.Flags(fs, `tracing`)
	rollbarConfig := rollbar.Flags(fs, `rollbar`)
	owaspConfig := owasp.Flags(fs, ``)
	corsConfig := cors.Flags(fs, `cors`)

	authConfig := auth.Flags(fs, `auth`)
	dockerConfig := docker.Flags(fs, `docker`)
	deployConfig := deploy.Flags(fs, `docker`)
	streamConfig := stream.Flags(fs, `docker`)
	mailerConfig := client.Flags(fs, `mailer`)

	if err := fs.Parse(os.Args[1:]); err != nil {
		logger.Fatal(`%+v`, err)
	}

	alcotest.DoAndExit(alcotestConfig)

	serverApp := httputils.New(serverConfig)
	healthcheckApp := healthcheck.New()
	prometheusApp := prometheus.New(prometheusConfig)
	opentracingApp := opentracing.New(opentracingConfig)
	rollbarApp := rollbar.New(rollbarConfig)
	gzipApp := gzip.New()
	owaspApp := owasp.New(owaspConfig)
	corsApp := cors.New(corsConfig)

	authApp := auth.New(authConfig)
	dockerApp, err := docker.New(dockerConfig)
	if err != nil {
		logger.Fatal(`%+v`, err)
	}

	streamApp, err := stream.New(streamConfig, authApp, dockerApp)
	if err != nil {
		logger.Fatal(`%+v`, err)
	}

	mailerApp := client.New(mailerConfig)
	deployApp := deploy.New(deployConfig, dockerApp, mailerApp)
	apiApp := api.New(dockerApp, deployApp)

	restHandler := server.ChainMiddlewares(apiApp.Handler(), prometheusApp, opentracingApp, rollbarApp, gzipApp, owaspApp, corsApp, authApp)
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
