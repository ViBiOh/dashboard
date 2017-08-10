package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"strings"
	"time"

	"github.com/ViBiOh/alcotest/alcotest"
	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/dashboard/docker"
	"github.com/ViBiOh/httputils"
	"github.com/ViBiOh/httputils/cors"
	"github.com/ViBiOh/httputils/owasp"
)

const port = `1080`
const restPrefix = `/`
const websocketPrefix = `/ws/`

var restHandler = owasp.Handler{Handler: cors.Handler{Handler: http.StripPrefix(restPrefix, docker.Handler{})}}
var websocketHandler = http.StripPrefix(websocketPrefix, docker.WebsocketHandler{})

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
			return fmt.Errorf(`Timeout exceeded for graceful close`)
		}
	}
}

func dashboardHandler(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, websocketPrefix) {
		websocketHandler.ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, restPrefix) {
		restHandler.ServeHTTP(w, r)
	} else {
		w.WriteHeader(http.StatusNotFound)
	}
}

func main() {
	url := flag.String(`c`, ``, `URL to healthcheck (check and exit)`)
	flag.Parse()

	if *url != `` {
		alcotest.Do(url)
		return
	}

	runtime.GOMAXPROCS(runtime.NumCPU())

	if err := auth.Init(); err != nil {
		log.Printf(`Error while initializing auth: %v`, err)
	}
	if err := docker.Init(); err != nil {
		log.Printf(`Error while initializing docker: %v`, err)
	}

	log.Print(`Starting server on port ` + port)

	server := &http.Server{
		Addr:    `:` + port,
		Handler: http.HandlerFunc(dashboardHandler),
	}

	go server.ListenAndServe()
	httputils.ServerGracefulClose(server, handleGracefulClose)
}
