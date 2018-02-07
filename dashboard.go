package main

import (
	"errors"
	"flag"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/ViBiOh/alcotest/alcotest"
	"github.com/ViBiOh/auth/auth"
	"github.com/ViBiOh/dashboard/docker"
	"github.com/ViBiOh/httputils"
	"github.com/ViBiOh/httputils/cert"
	"github.com/ViBiOh/httputils/cors"
	"github.com/ViBiOh/httputils/owasp"
)

const websocketPrefix = `/ws`

var (
	restHandler      http.Handler
	websocketHandler http.Handler
)

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

func dashboardHandler(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, websocketPrefix) {
		websocketHandler.ServeHTTP(w, r)
	} else {
		restHandler.ServeHTTP(w, r)
	}
}

func main() {
	port := flag.String(`port`, `1080`, `Listen port`)
	tls := flag.Bool(`tls`, true, `Serve TLS content`)
	alcotestConfig := alcotest.Flags(``)
	tlsConfig := cert.Flags(`tls`)
	authConfig := auth.Flags(`auth`)
	owaspConfig := owasp.Flags(``)
	corsConfig := cors.Flags(`cors`)
	flag.Parse()

	alcotest.DoAndExit(alcotestConfig)

	log.Print(`Starting server on port ` + *port)

	authApp := auth.NewApp(authConfig, nil)

	if err := docker.Init(authApp); err != nil {
		log.Printf(`Error while initializing docker: %v`, err)
	}

	restHandler = gziphandler.GzipHandler(owasp.Handler(owaspConfig, cors.Handler(corsConfig, docker.Handler())))
	websocketHandler = http.StripPrefix(websocketPrefix, docker.WebsocketHandler())

	server := &http.Server{
		Addr:    `:` + *port,
		Handler: http.HandlerFunc(dashboardHandler),
	}

	var serveError = make(chan error)
	go func() {
		defer close(serveError)
		if *tls {
			log.Print(`Listening with TLS enabled`)
			serveError <- cert.ListenAndServeTLS(tlsConfig, server)
		} else {
			log.Print(`⚠ dashboard is running without secure connection ⚠`)
			serveError <- server.ListenAndServe()
		}
	}()

	httputils.ServerGracefulClose(server, serveError, handleGracefulClose)
}
