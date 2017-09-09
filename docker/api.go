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
const healthPrefix = `/health`
const infoPrefix = `/info`
const containersPrefix = `/containers`
const servicesPrefix = `/services`

var backgroundTasks = sync.Map{}

var containerRequest = regexp.MustCompile(`^/([^/]+)/?$`)
var containerActionRequest = regexp.MustCompile(`^/([^/]+)/([^/]+)`)

func getCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 30*time.Second)
}

func getGracefulCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), DeployTimeout)
}

// CanBeGracefullyClosed indicates if application can terminate safely
func CanBeGracefullyClosed() (canBe bool) {
	canBe = true

	backgroundTasks.Range(func(_ interface{}, value interface{}) bool {
		canBe = !value.(bool)
		return canBe
	})

	return
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
	if (urlPath == `/` || urlPath == ``) && r.Method == http.MethodGet {
		listContainersHandler(w, user)
	} else if containerRequest.MatchString(urlPath) {
		containerID := containerRequest.FindStringSubmatch(urlPath)[1]

		if r.Method == http.MethodGet {
			basicActionHandler(w, user, containerID, inspectAction)
		} else if r.Method == http.MethodDelete {
			basicActionHandler(w, user, containerID, deleteAction)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	} else if containerActionRequest.MatchString(urlPath) && r.Method == http.MethodPost {
		matches := containerActionRequest.FindStringSubmatch(urlPath)
		basicActionHandler(w, user, matches[1], matches[2])
	} else if containerRequest.MatchString(urlPath) && r.Method == http.MethodPost {
		if composeBody, err := httputils.ReadBody(r.Body); err != nil {
			httputils.InternalServer(w, err)
		} else {
			composeHandler(w, user, containerRequest.FindStringSubmatch(urlPath)[1], composeBody)
		}
	} else {
		w.WriteHeader(http.StatusMethodNotAllowed)
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

	user, err := auth.IsAuthenticated(r)
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
