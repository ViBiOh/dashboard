package deploy

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/httputils/pkg/request"
	"github.com/ViBiOh/httputils/pkg/rollbar"
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

	composeFile, err := request.ReadBody(r.Body)
	if err != nil {
		return appName, nil, fmt.Errorf(`Error while reading compose file: %v`, err)
	}

	if len(appName) == 0 || len(composeFile) == 0 {
		return appName, nil, fmt.Errorf(`[%s] An application name and a compose file are required`, user.Username)
	}

	return appName, composeFile, nil
}

func (a *App) checkRights(ctx context.Context, user *model.User, appName string) ([]types.Container, error) {
	oldContainers, err := a.dockerApp.ListContainers(ctx, user, appName)
	if err != nil {
		return nil, fmt.Errorf(`Error while listing containers: %v`, err)
	}

	if len(oldContainers) > 0 && oldContainers[0].Labels[commons.OwnerLabel] != user.Username {
		return nil, fmt.Errorf(`[%s] [%s] Application not owned`, user.Username, appName)
	}

	return oldContainers, nil
}

func (a *App) checkTasks(user *model.User, appName string) error {
	if _, ok := a.tasks.Load(appName); ok {
		return fmt.Errorf(`[%s] [%s] Application already in deployment`, user.Username, appName)
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

func logError(format string, a ...interface{}) {
	err := fmt.Errorf(format, a...)

	log.Print(err)
	rollbar.Error(err)
}
