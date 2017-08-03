package docker

import (
	"context"
	"log"
	"net/http"
	"regexp"
	"sync"
	"time"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/dashboard/jsonHttp"
)

// DeployTimeout indicates delay for application to deploy before rollback
const DeployTimeout = 3 * time.Minute
const authorizationHeader = `Authorization`

var backgroundMutex = sync.RWMutex{}
var backgroundTasks = make(map[string]bool)

type results struct {
	Results interface{} `json:"results"`
}

var healthRequest = regexp.MustCompile(`^health$`)
var infoRequest = regexp.MustCompile(`info/?$`)

var containersRequest = regexp.MustCompile(`^containers`)
var listContainersRequest = regexp.MustCompile(`^containers/?$`)
var containerRequest = regexp.MustCompile(`^containers/([^/]+)/?$`)
var containerActionRequest = regexp.MustCompile(`^containers/([^/]+)/([^/]+)`)

var servicesRequest = regexp.MustCompile(`^services`)
var listServicesRequest = regexp.MustCompile(`^services/?$`)

// CanBeGracefullyClosed indicates if application can terminate safely
func CanBeGracefullyClosed() bool {
	backgroundMutex.RLock()
	defer backgroundMutex.RUnlock()

	for _, value := range backgroundTasks {
		if value {
			return false
		}
	}

	return true
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if docker != nil {
		w.WriteHeader(http.StatusOK)
	} else if docker == nil {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
}

func badRequest(w http.ResponseWriter, err error) {
	log.Printf(`HTTP/400 %v`, err)
	http.Error(w, err.Error(), http.StatusBadRequest)
}

func unauthorized(w http.ResponseWriter, err error) {
	log.Printf(`HTTP/401 %v`, err)
	http.Error(w, err.Error(), http.StatusUnauthorized)
}

func forbidden(w http.ResponseWriter) {
	http.Error(w, ``, http.StatusForbidden)
}

func errorHandler(w http.ResponseWriter, err error) {
	log.Printf(`HTTP/500 %v`, err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func infoHandler(w http.ResponseWriter) {
	if info, err := docker.Info(context.Background()); err != nil {
		errorHandler(w, err)
	} else {
		jsonHttp.ResponseJSON(w, info)
	}
}

func containersHandler(w http.ResponseWriter, r *http.Request, urlPath []byte, user *auth.User) {
	if listContainersRequest.Match(urlPath) && r.Method == http.MethodGet {
		listContainersHandler(w, user)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodGet {
		inspectContainerHandler(w, containerRequest.FindSubmatch(urlPath)[1])
	} else if containerActionRequest.Match(urlPath) && r.Method == http.MethodPost {
		matches := containerActionRequest.FindSubmatch(urlPath)
		basicActionHandler(w, user, matches[1], string(matches[2]))
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodDelete {
		basicActionHandler(w, user, containerRequest.FindSubmatch(urlPath)[1], deleteAction)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodPost {
		if composeBody, err := readBody(r.Body); err != nil {
			errorHandler(w, err)
		} else {
			composeHandler(w, user, containerRequest.FindSubmatch(urlPath)[1], composeBody)
		}
	}
}

func servicesHandler(w http.ResponseWriter, r *http.Request, urlPath []byte, user *auth.User) {
	if listServicesRequest.Match(urlPath) && r.Method == http.MethodGet {
		listServicesHandler(w, user)
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

	urlPath := []byte(r.URL.Path)

	if healthRequest.Match(urlPath) && r.Method == http.MethodGet {
		healthHandler(w, r)
		return
	}

	user, err := auth.IsAuthenticatedByAuth(r.Header.Get(authorizationHeader))
	if err != nil {
		unauthorized(w, err)
		return
	}

	if infoRequest.Match(urlPath) && r.Method == http.MethodGet {
		infoHandler(w)
	} else if containersRequest.Match(urlPath) {
		containersHandler(w, r, urlPath, user)
	} else if servicesRequest.Match(urlPath) {
		servicesHandler(w, r, urlPath, user)
	}
}
