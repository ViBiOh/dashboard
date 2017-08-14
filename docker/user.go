package docker

import (
	"fmt"

	"github.com/ViBiOh/dashboard/auth"
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

func isAllowed(user *auth.User, containerID string) (bool, error) {
	if user == nil {
		return false, nil
	}

	if !isAdmin(user) {
		container, err := inspectContainer(string(containerID))
		if err != nil {
			return false, fmt.Errorf(`Error while inspecting container: %v`, err)
		}

		owner, ok := container.Config.Labels[ownerLabel]
		if !ok || owner != user.Username {
			return false, nil
		}
	}

	return true, nil
}
