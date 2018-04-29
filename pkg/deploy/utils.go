package deploy

import (
	"context"

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
