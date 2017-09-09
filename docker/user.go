package docker

import (
	"fmt"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types"
)

const adminUser = `admin`
const multiAppUser = `multi`

func isAdmin(user *auth.User) bool {
	if user == nil {
		return false
	}

	return user.HasProfile(adminUser)
}

func isMultiApp(user *auth.User) bool {
	if user == nil {
		return false
	}

	return user.HasProfile(adminUser) || user.HasProfile(multiAppUser)
}

func isAllowed(user *auth.User, containerID string) (bool, *types.ContainerJSON, error) {
	if user == nil {
		return false, nil, fmt.Errorf(`User is required for checking rights`)
	}

	if !isAdmin(user) {
		container, err := inspectContainer(containerID)
		if err != nil {
			return false, nil, fmt.Errorf(`Error while inspecting container: %v`, err)
		}

		owner, ok := container.Config.Labels[ownerLabel]
		if !ok || owner != user.Username {
			return false, nil, nil
		}
		return true, &container, nil
	}

	return true, nil, nil
}
