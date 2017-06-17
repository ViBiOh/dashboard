package docker

import (
	"context"
	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/dashboard/jsonHttp"
	"log"
	"net/http"
	"regexp"
)

const authorizationHeader = `Authorization`

type results struct {
	Results interface{} `json:"results"`
}

var statusRequest = regexp.MustCompile(`^/status$`)
var containersRequest = regexp.MustCompile(`containers/?$`)
var containerRequest = regexp.MustCompile(`containers/([^/]+)/?$`)
var containerStartRequest = regexp.MustCompile(`containers/([^/]+)/start`)
var containerStopRequest = regexp.MustCompile(`containers/([^/]+)/stop`)
var containerRestartRequest = regexp.MustCompile(`containers/([^/]+)/restart`)

var servicesRequest = regexp.MustCompile(`services/?$`)

var infoRequest = regexp.MustCompile(`info/?$`)

func errorHandler(w http.ResponseWriter, err error) {
	log.Print(err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	if docker != nil {
		w.Write([]byte(`OK`))
	} else {
		w.Write([]byte(`KO`))
	}
}

func unauthorized(w http.ResponseWriter, err error) {
	http.Error(w, err.Error(), http.StatusUnauthorized)
}

func forbidden(w http.ResponseWriter) {
	http.Error(w, `Forbidden`, http.StatusForbidden)
}

func infoHandler(w http.ResponseWriter) {
	if info, err := docker.Info(context.Background()); err != nil {
		errorHandler(w, err)
	} else {
		jsonHttp.ResponseJSON(w, info)
	}
}

// Handler for Docker request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(`Access-Control-Allow-Origin`, `*`)
	w.Header().Add(`Access-Control-Allow-Headers`, `Content-Type, Authorization`)
	w.Header().Add(`Access-Control-Allow-Methods`, `GET, POST, DELETE`)
	w.Header().Add(`X-Content-Type-Options`, `nosniff`)

	urlPath := []byte(r.URL.Path)

	if r.Method == http.MethodOptions {
		if statusRequest.Match(urlPath) {
			statusHandler(w, r)
		} else {
			w.Write(nil)
		}
		return
	}

	user, err := auth.IsAuthenticatedByAuth(r.Header.Get(authorizationHeader))
	if err != nil {
		unauthorized(w, err)
		return
	}

	if infoRequest.Match(urlPath) && r.Method == http.MethodGet {
		infoHandler(w)
	} else if containersRequest.Match(urlPath) && r.Method == http.MethodGet {
		listContainersHandler(w, user)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodGet {
		inspectContainerHandler(w, containerRequest.FindSubmatch(urlPath)[1])
	} else if containerStartRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, user, containerStartRequest.FindSubmatch(urlPath)[1], startContainer)
	} else if containerStopRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, user, containerStopRequest.FindSubmatch(urlPath)[1], stopContainer)
	} else if containerRestartRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, user, containerRestartRequest.FindSubmatch(urlPath)[1], restartContainer)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodDelete {
		basicActionHandler(w, user, containerRequest.FindSubmatch(urlPath)[1], rmContainer)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodPost {
		if composeBody, err := readBody(r.Body); err != nil {
			errorHandler(w, err)
		} else {
			createAppHandler(w, user, containerRequest.FindSubmatch(urlPath)[1], composeBody)
		}
	} else if servicesRequest.Match(urlPath) && r.Method == http.MethodGet {
		listServicesHandler(w, user)
	}
}
