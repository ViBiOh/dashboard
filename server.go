package main

import (
	"github.com/ViBiOh/dashboard/docker"
	"log"
	"net/http"
	"runtime"
)

const port = `1080`

const restPrefix = `/`
const websocketPrefix = `/ws/`
const host = `DOCKER_HOST`
const version = `DOCKER_VERSION`

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	http.Handle(websocketPrefix, http.StripPrefix(websocketPrefix, docker.WebsocketHandler{}))
	http.Handle(restPrefix, http.StripPrefix(restPrefix, docker.Handler{}))

	log.Print(`Starting server on port ` + port)
	log.Fatal(http.ListenAndServe(`:`+port, nil))
}
