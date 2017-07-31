package docker

import (
	"context"
	"net/http"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/dashboard/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
)

const ownerLabel = `owner`
const appLabel = `app`

func listServices(user *auth.User, appName string) ([]swarm.Service, error) {
	options := types.ServiceListOptions{}

	options.Filters = filters.NewArgs()
	if err := labelFilters(&options.Filters, user, appName); err != nil {
		return nil, err
	}

	return docker.ServiceList(context.Background(), options)
}

func listServicesHandler(w http.ResponseWriter, user *auth.User) {
	if services, err := listServices(user, ``); err != nil {
		errorHandler(w, err)
	} else {
		jsonHttp.ResponseJSON(w, results{services})
	}
}
