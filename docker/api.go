package docker

import (
	"log"
	"net/http"
	"regexp"
)

type results struct {
	Results interface{} `json:"results"`
}

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

	if r.Method == http.MethodOptions {
		w.Write(nil)
		return
	}

	loggedUser, err := isAuthenticated(r.BasicAuth())
	if err != nil {
		unauthorized(w, err)
		return
	}

	urlPath := []byte(r.URL.Path)

	if infoRequest.Match(urlPath) && r.Method == http.MethodGet {
		infoHandler(w)
	} else if containersRequest.Match(urlPath) && r.Method == http.MethodGet {
		listContainersHandler(w, loggedUser)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodGet {
		inspectContainerHandler(w, containerRequest.FindSubmatch(urlPath)[1])
	} else if containerStartRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, loggedUser, containerStartRequest.FindSubmatch(urlPath)[1], startContainer)
	} else if containerStopRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, loggedUser, containerStopRequest.FindSubmatch(urlPath)[1], stopContainer)
	} else if containerRestartRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, loggedUser, containerRestartRequest.FindSubmatch(urlPath)[1], restartContainer)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodDelete {
		basicActionHandler(w, loggedUser, containerRequest.FindSubmatch(urlPath)[1], rmContainer)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodPost {
		if composeBody, err := readBody(r.Body); err != nil {
			errorHandler(w, err)
		} else {
			createAppHandler(w, loggedUser, containerRequest.FindSubmatch(urlPath)[1], composeBody)
		}
	} else if servicesRequest.Match(urlPath) && r.Method == http.MethodGet {
		listContainersHandler(w, loggedUser)
	}
}
