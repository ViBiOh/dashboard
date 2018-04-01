package docker

import (
	"fmt"
	"log"
	"net/http"

	authProvider "github.com/ViBiOh/auth/pkg/provider"
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

func (a *App) listContainers(user *authProvider.User, appName string) ([]types.Container, error) {
	options := types.ContainerListOptions{All: true}

	options.Filters = filters.NewArgs()
	labelFilters(user, &options.Filters, appName)

	ctx, cancel := getCtx()
	defer cancel()

	return a.docker.ContainerList(ctx, options)
}

func (a *App) inspectContainer(containerID string) (*types.ContainerJSON, error) {
	ctx, cancel := getCtx()
	defer cancel()

	container, err := a.docker.ContainerInspect(ctx, containerID)
	return &container, err
}

func getContainer(containerID string, container *types.ContainerJSON) (interface{}, error) {
	return container, nil
}

func (a *App) startContainer(containerID string, _ *types.ContainerJSON) (interface{}, error) {
	ctx, cancel := getCtx()
	defer cancel()

	return nil, a.docker.ContainerStart(ctx, containerID, types.ContainerStartOptions{})
}

func (a *App) stopContainer(containerID string, _ *types.ContainerJSON) (interface{}, error) {
	ctx, cancel := getGracefulCtx()
	defer cancel()

	return nil, a.docker.ContainerStop(ctx, containerID, nil)
}

func (a *App) restartContainer(containerID string, _ *types.ContainerJSON) (interface{}, error) {
	ctx, cancel := getCtx()
	defer cancel()

	return nil, a.docker.ContainerRestart(ctx, containerID, nil)
}

func (a *App) rmContainerAndImages(containerID string, container *types.ContainerJSON) (interface{}, error) {
	return a.rmContainer(containerID, container, true)
}

func (a *App) rmContainer(containerID string, container *types.ContainerJSON, failOnImageFail bool) (interface{}, error) {
	ctx, cancel := getCtx()
	defer cancel()

	var err error

	if container == nil {
		if container, err = a.inspectContainer(containerID); err != nil {
			return nil, fmt.Errorf(`Error while inspecting container: %v`, err)
		}
	}

	if err = a.docker.ContainerRemove(ctx, containerID, types.ContainerRemoveOptions{RemoveVolumes: true, Force: true}); err != nil {
		return nil, fmt.Errorf(`Error while removing container: %v`, err)
	}

	if err = a.rmImages(container.Image); err != nil {
		if failOnImageFail {
			return nil, err
		}
		log.Print(err)
	}

	return nil, nil
}

func (a *App) rmImages(imageID string) error {
	ctx, cancel := getCtx()
	defer cancel()

	if _, err := a.docker.ImageRemove(ctx, imageID, types.ImageRemoveOptions{}); err != nil {
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
		return a.startContainer
	case stopAction:
		return a.stopContainer
	case restartAction:
		return a.restartContainer
	case deleteAction:
		return a.rmContainerAndImages
	default:
		return invalidAction
	}
}

func (a *App) basicActionHandler(w http.ResponseWriter, r *http.Request, user *authProvider.User, containerID string, action string) {
	if allowed, container, err := a.isAllowed(user, containerID); err != nil {
		httperror.InternalServerError(w, err)
	} else if !allowed {
		httperror.Forbidden(w)
	} else if result, err := a.doAction(action)(containerID, container); err != nil {
		httperror.InternalServerError(w, err)
	} else if err := httpjson.ResponseJSON(w, http.StatusOK, result, httpjson.IsPretty(r.URL.RawQuery)); err != nil {
		httperror.InternalServerError(w, err)
	}
}

func (a *App) listContainersHandler(w http.ResponseWriter, r *http.Request, user *authProvider.User) {
	if containers, err := a.listContainers(user, ``); err != nil {
		httperror.InternalServerError(w, err)
	} else if err := httpjson.ResponseArrayJSON(w, http.StatusOK, containers, httpjson.IsPretty(r.URL.RawQuery)); err != nil {
		httperror.InternalServerError(w, err)
	}
}
