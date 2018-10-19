package docker

import (
	"context"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/docker/docker/api/types"
)

const (
	adminUser    = `admin`
	multiAppUser = `multi`
)

// IsAdmin check if given user is admin
func IsAdmin(user *model.User) bool {
	if user == nil {
		return false
	}

	return user.HasProfile(adminUser)
}

func isMultiApp(user *model.User) bool {
	if user == nil {
		return false
	}

	return user.HasProfile(adminUser) || user.HasProfile(multiAppUser)
}

func (a *App) isAllowed(ctx context.Context, user *model.User, containerID string) (bool, *types.ContainerJSON, error) {
	if user == nil {
		return false, nil, commons.ErrUserRequired
	}

	container, err := a.InspectContainer(ctx, containerID)
	if err != nil {
		return false, nil, err
	}

	if !IsAdmin(user) {
		owner, ok := container.Config.Labels[commons.OwnerLabel]
		if !ok || owner != user.Username {
			return false, nil, nil
		}
	}

	return true, container, nil
}
