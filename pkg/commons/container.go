package commons

import (
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
)

// FilterContainers filters a list of containers
func FilterContainers(containers []*types.ContainerJSON, filter func(*types.ContainerJSON) bool) []*types.ContainerJSON {
	filteredContainers := make([]*types.ContainerJSON, 0)

	for _, container := range containers {
		if filter(container) {
			filteredContainers = append(filteredContainers, container)
		}
	}

	return filteredContainers
}

// GetContainersIDs map containers list to IDs
func GetContainersIDs(containers []*types.ContainerJSON) []string {
	ids := make([]string, 0)

	for _, container := range containers {
		ids = append(ids, container.ID)
	}

	return ids
}

// EventFilters add filter for wanted events
func EventFilters(filtersArgs *filters.Args) {
	filtersArgs.Add("event", "create")
	filtersArgs.Add("event", "start")
	filtersArgs.Add("event", "stop")
	filtersArgs.Add("event", "restart")
	filtersArgs.Add("event", "rename")
	filtersArgs.Add("event", "update")
	filtersArgs.Add("event", "destroy")
	filtersArgs.Add("event", "die")
	filtersArgs.Add("event", "kill")
}
