package main

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/httputils/pkg"
	"github.com/ViBiOh/httputils/pkg/cors"
	"github.com/ViBiOh/httputils/pkg/datadog"
	"github.com/ViBiOh/httputils/pkg/owasp"
)

const websocketPrefix = `/ws`

func handleGracefulClose() error {
	if docker.CanBeGracefullyClosed() {
		return nil
	}

	ticker := time.Tick(15 * time.Second)
	timeout := time.After(docker.DeployTimeout)

	for {
		select {
		case <-ticker:
			if docker.CanBeGracefullyClosed() {
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
	datadogConfig := datadog.Flags(`datadog`)

	httputils.NewApp(httputils.Flags(``), func() http.Handler {
		dockerApp, err := docker.NewApp(dockerConfig, auth.NewApp(authConfig, nil))
		if err != nil {
			log.Fatalf(`Error while creating docker: %v`, err)
		}

		restHandler := datadog.NewApp(datadogConfig).Handler(gziphandler.GzipHandler(owasp.Handler(owaspConfig, cors.Handler(corsConfig, dockerApp.Handler()))))
		websocketHandler := http.StripPrefix(websocketPrefix, dockerApp.WebsocketHandler())

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, websocketPrefix) {
				websocketHandler.ServeHTTP(w, r)
			} else {
				restHandler.ServeHTTP(w, r)
			}
		})
	}, handleGracefulClose).ListenAndServe()
}
