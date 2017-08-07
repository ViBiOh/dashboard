package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strings"
	"syscall"
	"time"

	"github.com/ViBiOh/alcotest/alcotest"
	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/dashboard/docker"
)

const port = `1080`
const restPrefix = `/`
const websocketPrefix = `/ws/`

var restHandler = http.StripPrefix(restPrefix, docker.Handler{})
var websocketHandler = http.StripPrefix(websocketPrefix, docker.WebsocketHandler{})

func dashboardHandler(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, websocketPrefix) {
		websocketHandler.ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, restPrefix) {
		restHandler.ServeHTTP(w, r)
	} else {
		w.WriteHeader(http.StatusNotFound)
	}
}

func handleGracefulClose(server *http.Server) {
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGTERM)

	<-signals

	log.Printf(`SIGTERM received`)

	if server != nil {
		log.Print(`Shutting down http server`)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Print(err)
		}
	}

	if docker.CanBeGracefullyClosed() {
		return
	}

	ticker := time.Tick(15 * time.Second)
	timeout := time.After(docker.DeployTimeout)

	for {
		select {
		case <-ticker:
			if docker.CanBeGracefullyClosed() {
				return
			}
		case <-timeout:
			os.Exit(1)
		}
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

	auth.Init()
	if err := docker.Init(); err != nil {
		log.Printf(`Error while initializing docker: %v`, err)
	}

	log.Print(`Starting server on port ` + port)

	server := &http.Server{
		Addr:    `:` + port,
		Handler: http.HandlerFunc(dashboardHandler),
	}

	go server.ListenAndServe()
	handleGracefulClose(server)
}
