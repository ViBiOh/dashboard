package docker

import (
	"fmt"
	"log"
	"net/http"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/httputils/pkg/httperror"
	"github.com/ViBiOh/httputils/pkg/httpjson"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
)

const (
	getAction     = `get`
	startAction   = `start`
	stopAction    = `stop`
	restartAction = `restart`
	deleteAction  = `delete`
)

// ListContainers list containers for user and app if provided
func (a *App) ListContainers(user *model.User, appName string) ([]types.Container, error) {
	options := types.ContainerListOptions{All: true}

	options.Filters = filters.NewArgs()
	LabelFilters(user, &options.Filters, appName)

	ctx, cancel := commons.GetCtx()
	defer cancel()

	return a.Docker.ContainerList(ctx, options)
}

// InspectContainer get detailed information of a container
func (a *App) InspectContainer(containerID string) (*types.ContainerJSON, error) {
	ctx, cancel := commons.GetCtx()
	defer cancel()

	container, err := a.Docker.ContainerInspect(ctx, containerID)
	return &container, err
}

func getContainer(containerID string, container *types.ContainerJSON) (interface{}, error) {
	return container, nil
}

// StartContainer start a container
func (a *App) StartContainer(containerID string, _ *types.ContainerJSON) (interface{}, error) {
	ctx, cancel := commons.GetCtx()
	defer cancel()

	return nil, a.Docker.ContainerStart(ctx, containerID, types.ContainerStartOptions{})
}

// StopContainer stop a container
func (a *App) StopContainer(containerID string, _ *types.ContainerJSON) (interface{}, error) {
	ctx, cancel := commons.GetCtx()
	defer cancel()

	return nil, a.Docker.ContainerStop(ctx, containerID, nil)
}

// RestartContainer restarts a container
func (a *App) RestartContainer(containerID string, _ *types.ContainerJSON) (interface{}, error) {
	ctx, cancel := commons.GetCtx()
	defer cancel()

	return nil, a.Docker.ContainerRestart(ctx, containerID, nil)
}

// RmContainerAndImages clean env
func (a *App) RmContainerAndImages(containerID string, container *types.ContainerJSON) (interface{}, error) {
	return a.RmContainer(containerID, container, true)
}

// RmContainer remove a container
func (a *App) RmContainer(containerID string, container *types.ContainerJSON, failOnImageFail bool) (interface{}, error) {
	ctx, cancel := commons.GetCtx()
	defer cancel()

	var err error

	if container == nil {
		if container, err = a.InspectContainer(containerID); err != nil {
			return nil, fmt.Errorf(`Error while inspecting container: %v`, err)
		}
	}

	if err = a.Docker.ContainerRemove(ctx, containerID, types.ContainerRemoveOptions{RemoveVolumes: true, Force: true}); err != nil {
		return nil, fmt.Errorf(`Error while removing container: %v`, err)
	}

	if err = a.RmImage(container.Image); err != nil {
		if failOnImageFail {
			return nil, err
		}
		log.Print(err)
	}

	return nil, nil
}

// RmImage remove image
func (a *App) RmImage(imageID string) error {
	ctx, cancel := commons.GetCtx()
	defer cancel()

	if _, err := a.Docker.ImageRemove(ctx, imageID, types.ImageRemoveOptions{}); err != nil {
		return fmt.Errorf(`Error while removing image: %v`, err)
	}

	return nil
}

func invalidAction(action string, _ *types.ContainerJSON) (interface{}, error) {
	return nil, fmt.Errorf(`Unknown action %s`, action)
}

func (a *App) doAction(action string) func(string, *types.ContainerJSON) (interface{}, error) {
	switch action {
	case getAction:
		return getContainer
	case startAction:
		return a.StartContainer
	case stopAction:
		return a.StopContainer
	case restartAction:
		return a.RestartContainer
	case deleteAction:
		return a.RmContainerAndImages
	default:
		return invalidAction
	}
}

func (a *App) basicActionHandler(w http.ResponseWriter, r *http.Request, user *model.User, containerID string, action string) {
	allowed, container, err := a.isAllowed(user, containerID)
	if err != nil {
		httperror.InternalServerError(w, err)
		return
	}

	if !allowed {
		httperror.Forbidden(w)
		return
	}

	result, err := a.doAction(action)(containerID, container)
	if err != nil {
		httperror.InternalServerError(w, err)
		return
	}

	if err := httpjson.ResponseJSON(w, http.StatusOK, result, httpjson.IsPretty(r.URL.RawQuery)); err != nil {
		httperror.InternalServerError(w, err)
		return
	}
}

// ListContainersHandler handler list of containers
func (a *App) ListContainersHandler(w http.ResponseWriter, r *http.Request, user *model.User) {
	containers, err := a.ListContainers(user, ``)
	if err != nil {
		httperror.InternalServerError(w, err)
		return
	}

	if err := httpjson.ResponseArrayJSON(w, http.StatusOK, containers, httpjson.IsPretty(r.URL.RawQuery)); err != nil {
		httperror.InternalServerError(w, err)
		return
	}
}

// LabelFilters add filter for given user
func LabelFilters(user *model.User, filtersArgs *filters.Args, appName string) {
	if appName != `` && isMultiApp(user) {
		filtersArgs.Add(`label`, fmt.Sprintf(`%s=%s`, commons.AppLabel, appName))
	} else if !IsAdmin(user) {
		filtersArgs.Add(`label`, fmt.Sprintf(`%s=%s`, commons.OwnerLabel, user.Username))
	}
}
