package docker

import (
	"context"
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

	return docker.ServiceList(context.Background(), options)
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

func servicesHandler(w http.ResponseWriter, r *http.Request, urlPath []byte, user *auth.User) {
	if listServicesRequest.Match(urlPath) && r.Method == http.MethodGet {
		listServicesHandler(w, user)
	}
}
