package docker

import (
	"net/http"

	"github.com/ViBiOh/auth/auth"
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

func listServicesHandler(w http.ResponseWriter, r *http.Request, user *auth.User) {
	if user == nil {
		httputils.BadRequest(w, errUserRequired)
		return
	}

	if services, err := listServices(user, ``); err != nil {
		httputils.InternalServerError(w, err)
	} else {
		httputils.ResponseArrayJSON(w, http.StatusOK, services, httputils.IsPretty(r.URL.RawQuery))
	}
}

func servicesHandler(w http.ResponseWriter, r *http.Request, urlPath string, user *auth.User) {
	if (urlPath == `/` || urlPath == ``) && r.Method == http.MethodGet {
		listServicesHandler(w, r, user)
	} else {
		httputils.NotFound(w)
	}
}
