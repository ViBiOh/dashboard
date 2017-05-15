package docker

import (
	"context"
	"github.com/ViBiOh/dashboard/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
	"net/http"
)

const ownerLabel = `owner`
const appLabel = `app`

func listServices(loggedUser *user, appName *string) ([]swarm.Service, error) {
	options := types.ServiceListOptions{}

	options.Filters = filters.NewArgs()
	if err := labelFilters(&options.Filters, loggedUser, appName); err != nil {
		return nil, err
	}

	return docker.ServiceList(context.Background(), options)
}

func listServicesHandler(w http.ResponseWriter, loggerUser *user) {
	if services, err := listServices(loggerUser, nil); err != nil {
		errorHandler(w, err)
	} else {
		jsonHttp.ResponseJSON(w, results{services})
	}
}
