package docker

import (
	"github.com/ViBiOh/dashboard/auth"
)

const adminUser = `admin`
const multiAppUser = `multi`

func isAdmin(user *auth.User) bool {
	if user != nil {
		return user.Profile == adminUser
	}
	return false
}

func isMultiApp(user *auth.User) bool {
	if user != nil {
		return user.Profile == multiAppUser || user.Profile == adminUser
	}
	return false
}

func isAllowed(user *auth.User, containerID string) (bool, error) {
	if !isAdmin(user) {
		container, err := inspectContainer(string(containerID))
		if err != nil {
			return false, err
		}

		owner, ok := container.Config.Labels[ownerLabel]
		if !ok || owner != user.Username {
			return false, nil
		}
	}

	return true, nil
}
