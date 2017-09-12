package docker

import (
	"fmt"
	"net/http"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
)

func listServices(user *auth.User, appName string) ([]swarm.Service, error) {
	options := types.ServiceListOptions{}

	options.Filters = filters.NewArgs()
	labelFilters(user, &options.Filters, appName)

	ctx, cancel := getCtx()
	defer cancel()

	return docker.ServiceList(ctx, options)
}

func listServicesHandler(w http.ResponseWriter, user *auth.User) {
	if user == nil {
		httputils.BadRequest(w, fmt.Errorf(`A user is required`))
		return
	}

	if services, err := listServices(user, ``); err != nil {
		httputils.InternalServer(w, err)
	} else {
		httputils.ResponseArrayJSON(w, services)
	}
}

func servicesHandler(w http.ResponseWriter, r *http.Request, urlPath string, user *auth.User) {
	if (urlPath == `/` || urlPath == ``) && r.Method == http.MethodGet {
		listServicesHandler(w, user)
	} else {
		w.WriteHeader(http.StatusNotFound)
	}
}
