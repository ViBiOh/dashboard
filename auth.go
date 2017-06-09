package main

import (
	"log"
	"net/http"
	"runtime"
)

const port = `1080`

const restPrefix = `/`

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	http.Handle(restPrefix, http.StripPrefix(restPrefix, docker.Handler{}))

	log.Print(`Starting server on port ` + port)
	log.Fatal(http.ListenAndServe(`:`+port, nil))
}
