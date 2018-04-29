package commons

import "github.com/docker/docker/api/types"

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
