package docker

import (
  "github.com/ViBiOh/dashboard/auth"
)

const adminUser = `admin`
const multiAppUser = `multi`

func isAdmin(user *auth.User) bool {
  if user != nil {
    return user.role == adminUser
  }
  return false
}

func isMultiApp(user *auth.User) bool {
  if user != nil {
    return user.role == multiAppUser || user.role == adminUser
  }
  return false
}

func isAllowed(loggedUser *User, containerID string) (bool, error) {
	if !isAdmin(loggedUser) {
		container, err := inspectContainer(string(containerID))
		if err != nil {
			return false, err
		}

		owner, ok := container.Config.Labels[ownerLabel]
		if !ok || owner != loggedUser.username {
			return false, nil
		}
	}

	return true, nil
}
