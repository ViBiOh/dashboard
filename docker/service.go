package docker

import (
	"context"
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
	if err := labelFilters(user, &options.Filters, appName); err != nil {
		return nil, err
	}

	return docker.ServiceList(context.Background(), options)
}

func listServicesHandler(w http.ResponseWriter, user *auth.User) {
	if services, err := listServices(user, ``); err != nil {
		httputils.InternalServer(w, err)
	} else {
		httputils.ResponseArrayJSON(w, services)
	}
}
