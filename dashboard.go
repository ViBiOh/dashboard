package main

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/ViBiOh/auth/auth"
	"github.com/ViBiOh/dashboard/docker"
	"github.com/ViBiOh/httputils"
	"github.com/ViBiOh/httputils/cors"
	"github.com/ViBiOh/httputils/owasp"
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

	httputils.StartMainServer(func() http.Handler {
		authApp := auth.NewApp(authConfig, nil)

		if err := docker.Init(authApp); err != nil {
			log.Fatalf(`Error while initializing docker: %v`, err)
		}

		restHandler := gziphandler.GzipHandler(owasp.Handler(owaspConfig, cors.Handler(corsConfig, docker.Handler())))
		websocketHandler := http.StripPrefix(websocketPrefix, docker.WebsocketHandler())

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, websocketPrefix) {
				websocketHandler.ServeHTTP(w, r)
			} else {
				restHandler.ServeHTTP(w, r)
			}
		})
	}, handleGracefulClose)
}
