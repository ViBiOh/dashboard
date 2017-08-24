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
	"github.com/ViBiOh/httputils/cert"
	"github.com/ViBiOh/httputils/cors"
	"github.com/ViBiOh/httputils/owasp"
	"github.com/ViBiOh/httputils/prometheus"
)

const port = `1080`
const websocketPrefix = `/ws/`

var restHandler = prometheus.NewPrometheusHandler(`http`, owasp.Handler{Handler: cors.Handler{Handler: http.StripPrefix(`/`, docker.Handler{})}})
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
	} else {
		restHandler.ServeHTTP(w, r)
	}
}

func main() {
	url := flag.String(`c`, ``, `URL to healthcheck (check and exit)`)
	tlsCert := flag.String(`tlsCert`, ``, `TLS PEM Certificate file`)
	tlsKey := flag.String(`tlsKey`, ``, `TLS PEM Key file`)
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

	if *tlsCert != `` {
		go log.Panic(server.ListenAndServeTLS(*tlsCert, *tlsKey))
	} else {
		certPEMBlock, keyPEMBlock, err := cert.GenerateCert(`ViBiOh`, []string{`localhost`})
		if err != nil {
			log.Panicf(`Error while generating certificate: %v`, err)
		}

		go log.Panic(cert.ListenAndServeTLS(server, certPEMBlock, keyPEMBlock))
	}

	httputils.ServerGracefulClose(server, handleGracefulClose)
}
