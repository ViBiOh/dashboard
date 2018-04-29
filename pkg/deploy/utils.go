package deploy

import (
	"context"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
)

func getGracefulCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), DeployTimeout)
}

func healthyStatusFilters(filtersArgs *filters.Args, containersIds []string) {
	filtersArgs.Add(`event`, `health_status: healthy`)

	for _, container := range containersIds {
		filtersArgs.Add(`container`, container)
	}
}

func hasHealthcheck(container *types.ContainerJSON) bool {
	return container != nil && container.Config != nil && container.Config.Healthcheck != nil && len(container.Config.Healthcheck.Test) != 0
}
