package docker

import (
	"context"
	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/dashboard/jsonHttp"
	"log"
	"os"
	"os/signal"
	"net/http"
	"regexp"
	"sync"
	"syscall"
	"time"
)

const authorizationHeader = `Authorization`
const gracefulCloseDelay = 30

var gracefulCloseTimestamp time.Time
var gracefulCloseMutex = sync.RWMutex{}
var gracefulCloseCounter = 0

type results struct {
	Results interface{} `json:"results"`
}

var healthRequest = regexp.MustCompile(`^health$`)
var infoRequest = regexp.MustCompile(`info/?$`)

var containersRequest = regexp.MustCompile(`^containers`)
var listContainersRequest = regexp.MustCompile(`^containers/?$`)
var containerRequest = regexp.MustCompile(`^containers/([^/]+)/?$`)
var containerStartRequest = regexp.MustCompile(`^containers/([^/]+)/start`)
var containerStopRequest = regexp.MustCompile(`^containers/([^/]+)/stop`)
var containerRestartRequest = regexp.MustCompile(`^containers/([^/]+)/restart`)

var servicesRequest = regexp.MustCompile(`^services`)
var listServicesRequest = regexp.MustCompile(`^services/?$`)

func canBeGracefullyClosed() bool {
	gracefulCloseMutex.RLock()
	defer gracefulCloseMutex.Unlock()

	if gracefulCloseCounter != 0 {
		return false
	}

	return true
}

func isGracefullyClosed() bool {
	return !time.Time.IsZero(gracefulCloseTimestamp) && time.Now().After(gracefulCloseTimestamp)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if time.Time.IsZero(gracefulCloseTimestamp) && docker != nil {
		w.WriteHeader(http.StatusOK)
	} else if !time.Time.IsZero(gracefulCloseTimestamp) {
		if !isGracefullyClosed() {
			w.WriteHeader(http.StatusGone)
		} else {
			if canBeGracefullyClosed() {
				w.WriteHeader(http.StatusTeapot)
			} else {
				w.WriteHeader(http.StatusProcessing)
			}
		}
	} else if docker == nil {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
}

func addCounter(value int) {
	defer gracefulCloseMutex.Unlock()

	gracefulCloseMutex.Lock()
	gracefulCloseCounter = gracefulCloseCounter + value
}

func badRequest(w http.ResponseWriter, err error) {
	log.Print(err)
	http.Error(w, err.Error(), http.StatusBadRequest)
}

func unauthorized(w http.ResponseWriter, err error) {
	log.Print(err)
	http.Error(w, err.Error(), http.StatusUnauthorized)
}

func forbidden(w http.ResponseWriter) {
	http.Error(w, ``, http.StatusForbidden)
}

func errorHandler(w http.ResponseWriter, err error) {
	log.Print(err)
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
			addCounter(1)
			defer addCounter(-1)

			createAppHandler(w, user, containerRequest.FindSubmatch(urlPath)[1], composeBody)
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

	if isGracefullyClosed() {
		w.WriteHeader(http.StatusGone)
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
