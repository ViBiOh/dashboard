package deploy

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/httputils/pkg/errors"
	"github.com/ViBiOh/httputils/pkg/request"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
)

func healthyStatusFilters(filtersArgs *filters.Args, containersIds []string) {
	filtersArgs.Add(`event`, `health_status: healthy`)

	for _, container := range containersIds {
		filtersArgs.Add(`container`, container)
	}
}

func hasHealthcheck(container *types.ContainerJSON) bool {
	return container != nil && container.Config != nil && container.Config.Healthcheck != nil && len(container.Config.Healthcheck.Test) != 0
}

func checkParams(r *http.Request, user *model.User) (string, []byte, error) {
	appName := strings.Trim(r.URL.Path, `/`)

	if user == nil {
		return appName, nil, commons.ErrUserRequired
	}

	composeFile, err := request.ReadBodyRequest(r)
	if err != nil {
		return appName, nil, err
	}

	if len(appName) == 0 || len(composeFile) == 0 {
		return appName, nil, errors.New(`app name and compose file are required`)
	}

	return appName, composeFile, nil
}

func (a *App) checkRights(ctx context.Context, user *model.User, appName string) ([]types.Container, error) {
	oldContainers, err := a.dockerApp.ListContainers(ctx, user, appName)
	if err != nil {
		return nil, err
	}

	if len(oldContainers) > 0 && oldContainers[0].Labels[commons.OwnerLabel] != user.Username {
		return nil, errors.New(`user=%s app=%s application is not yours`, user.Username, appName)
	}

	return oldContainers, nil
}

func (a *App) checkTasks(user *model.User, appName string) error {
	if _, ok := a.tasks.Load(appName); ok {
		return errors.New(`user=%s app=%s deploy already running`, user.Username, appName)
	}
	a.tasks.Store(appName, true)

	return nil
}

func getServiceFullName(app string, service string) string {
	return fmt.Sprintf(`%s_%s%s`, app, service, deploySuffix)
}

func getFinalName(serviceFullName string) string {
	return strings.TrimSuffix(serviceFullName, deploySuffix)
}

func findServiceByContainerID(services map[string]*deployedService, containerID string) *deployedService {
	for _, service := range services {
		if service.ContainerID == containerID {
			return service
		}
	}

	return nil
}
