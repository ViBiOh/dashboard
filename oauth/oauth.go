package main

import (
	"flag"
	"log"
	"net/http"
	"runtime"
	"strings"

	"github.com/ViBiOh/alcotest/alcotest"
	"github.com/ViBiOh/dashboard/oauth/basic"
	"github.com/ViBiOh/dashboard/oauth/github"
	"github.com/ViBiOh/httputils"
)

const basicPrefix = `/basic`
const githubPrefix = `/github`

var basicHandler = http.StripPrefix(basicPrefix, basic.Handler{})
var githubHandler = http.StripPrefix(githubPrefix, github.Handler{})

// Init configure OAuth provided
func Init() {
	if err := basic.Init(); err != nil {
		log.Fatalf(`Error while initializing Basic auth: %v`, err)
	}
	if err := github.Init(); err != nil {
		log.Fatalf(`Error while initializing GitHub auth: %v`, err)
	}
}

func oauthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(`Access-Control-Allow-Origin`, `*`)
	w.Header().Add(`Access-Control-Allow-Headers`, `Content-Type`)
	w.Header().Add(`Access-Control-Allow-Methods`, `GET`)
	w.Header().Add(`X-Content-Type-Options`, `nosniff`)

	if strings.HasPrefix(r.URL.Path, githubPrefix) {
		githubHandler.ServeHTTP(w, r)
	} else if strings.HasPrefix(r.URL.Path, basicPrefix) {
		basicHandler.ServeHTTP(w, r)
	}
}

func main() {
	url := flag.String(`c`, ``, `URL to healthcheck (check and exit)`)
	port := flag.String(`port`, `1080`, `Listen port`)
	flag.Parse()

	if *url != `` {
		alcotest.Do(url)
		return
	}

	runtime.GOMAXPROCS(runtime.NumCPU())

	log.Printf(`Starting server on port %s`, *port)

	Init()

	server := &http.Server{
		Addr:    `:` + *port,
		Handler: http.HandlerFunc(oauthHandler),
	}

	go server.ListenAndServe()
	httputils.ServerGracefulClose(server, nil)
}
