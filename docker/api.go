package docker

import (
	"context"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/httputils"
)

// DeployTimeout indicates delay for application to deploy before rollback
const DeployTimeout = 3 * time.Minute
const healthPrefix = `/infos`
const infoPrefix = `/infos`
const containersPrefix = `/containers`
const servicesPrefix = `/services`

var backgroundMutex = sync.RWMutex{}
var backgroundTasks = make(map[string]bool)

var containerRequest = regexp.MustCompile(`^/([^/]+)/?$`)
var containerActionRequest = regexp.MustCompile(`^/([^/]+)/([^/]+)`)

func getCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 30*time.Second)
}

func getGracefulCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), DeployTimeout)
}

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
	} else {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
}

func infoHandler(w http.ResponseWriter) {
	ctx, cancel := getCtx()
	defer cancel()

	if info, err := docker.Info(ctx); err != nil {
		httputils.InternalServer(w, err)
	} else {
		httputils.ResponseJSON(w, info)
	}
}

func containersHandler(w http.ResponseWriter, r *http.Request, urlPath string, user *auth.User) {
	urlPathByte := []byte(urlPath)

	if containerRequest.MatchString(urlPath) && r.Method == http.MethodGet {
		inspectContainerHandler(w, containerRequest.FindSubmatch(urlPathByte)[1])
	} else if containerActionRequest.MatchString(urlPath) && r.Method == http.MethodPost {
		matches := containerActionRequest.FindSubmatch(urlPathByte)
		basicActionHandler(w, user, matches[1], string(matches[2]))
	} else if containerRequest.MatchString(urlPath) && r.Method == http.MethodDelete {
		basicActionHandler(w, user, containerRequest.FindSubmatch(urlPathByte)[1], deleteAction)
	} else if containerRequest.MatchString(urlPath) && r.Method == http.MethodPost {
		if composeBody, err := httputils.ReadBody(r.Body); err != nil {
			httputils.InternalServer(w, err)
		} else {
			composeHandler(w, user, containerRequest.FindSubmatch(urlPathByte)[1], composeBody)
		}
	} else if strings.HasPrefix(urlPath, `/`) {
		listContainersHandler(w, user)
	}
}

// Handler for Docker request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Write(nil)
		return
	}

	if strings.HasPrefix(r.URL.Path, healthPrefix) && r.Method == http.MethodGet {
		healthHandler(w, r)
		return
	}

	user, err := auth.IsAuthenticatedByAuth(r.Header.Get(`Authorization`))
	if err != nil {
		httputils.Unauthorized(w, err)
		return
	}

	if strings.HasPrefix(r.URL.Path, infoPrefix) && r.Method == http.MethodGet {
		infoHandler(w)
	} else if strings.HasPrefix(r.URL.Path, containersPrefix) {
		containersHandler(w, r, strings.TrimPrefix(r.URL.Path, containersPrefix), user)
	} else if strings.HasPrefix(r.URL.Path, servicesPrefix) {
		servicesHandler(w, r, strings.TrimPrefix(r.URL.Path, servicesPrefix), user)
	}
}
