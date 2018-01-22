package docker

import (
	"errors"
	"fmt"

	authProvider "github.com/ViBiOh/auth/provider"
	"github.com/docker/docker/api/types"
)

const (
	adminUser    = `admin`
	multiAppUser = `multi`
)

var errUserRequired = errors.New(`An user is required`)

func isAdmin(user *authProvider.User) bool {
	if user == nil {
		return false
	}

	return user.HasProfile(adminUser)
}

func isMultiApp(user *authProvider.User) bool {
	if user == nil {
		return false
	}

	return user.HasProfile(adminUser) || user.HasProfile(multiAppUser)
}

func isAllowed(user *authProvider.User, containerID string) (bool, *types.ContainerJSON, error) {
	if user == nil {
		return false, nil, errUserRequired
	}

	container, err := inspectContainer(containerID)
	if err != nil {
		return false, nil, fmt.Errorf(`Error while inspecting container: %v`, err)
	}

	if !isAdmin(user) {
		owner, ok := container.Config.Labels[ownerLabel]
		if !ok || owner != user.Username {
			return false, nil, nil
		}
	}

	return true, container, nil
}
