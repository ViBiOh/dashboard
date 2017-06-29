package main

import (
	"flag"
	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/dashboard/docker"
	"log"
	"net/http"
	"runtime"
)

const port = `1080`

const restPrefix = `/`
const websocketPrefix = `/ws/`

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	authFile := flag.String(`auth`, ``, `Path of authentification configuration file`)
	websocketOrigin := flag.String(`ws`, `^dashboard`, `Allowed WebSocket Origin pattern`)
	flag.Parse()

	auth.Init(*authFile)
	docker.Init(*websocketOrigin)

	http.Handle(websocketPrefix, http.StripPrefix(websocketPrefix, docker.WebsocketHandler{}))
	http.Handle(restPrefix, http.StripPrefix(restPrefix, docker.Handler{}))

	log.Print(`Starting server on port ` + port)
	log.Fatal(http.ListenAndServe(`:`+port, nil))
}
