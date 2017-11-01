package docker

import (
	"fmt"
	"log"
	"net/http"

	"github.com/ViBiOh/auth/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
)

const getAction = `get`
const startAction = `start`
const stopAction = `stop`
const restartAction = `restart`
const deleteAction = `delete`

func listContainers(user *auth.User, appName string) ([]types.Container, error) {
	options := types.ContainerListOptions{All: true}

	options.Filters = filters.NewArgs()
	labelFilters(user, &options.Filters, appName)

	ctx, cancel := getCtx()
	defer cancel()

	return docker.ContainerList(ctx, options)
}

func inspectContainer(containerID string) (*types.ContainerJSON, error) {
	ctx, cancel := getCtx()
	defer cancel()

	container, err := docker.ContainerInspect(ctx, containerID)
	return &container, err
}

func getContainer(containerID string, container *types.ContainerJSON) (interface{}, error) {
	return container, nil
}

func startContainer(containerID string, _ *types.ContainerJSON) (interface{}, error) {
	ctx, cancel := getCtx()
	defer cancel()

	return nil, docker.ContainerStart(ctx, containerID, types.ContainerStartOptions{})
}

func stopContainer(containerID string, _ *types.ContainerJSON) (interface{}, error) {
	ctx, cancel := getGracefulCtx()
	defer cancel()

	return nil, docker.ContainerStop(ctx, containerID, nil)
}

func restartContainer(containerID string, _ *types.ContainerJSON) (interface{}, error) {
	ctx, cancel := getCtx()
	defer cancel()

	return nil, docker.ContainerRestart(ctx, containerID, nil)
}

func rmContainerAndImages(containerID string, container *types.ContainerJSON) (interface{}, error) {
	return rmContainer(containerID, container, true)
}

func rmContainer(containerID string, container *types.ContainerJSON, failOnImageFail bool) (interface{}, error) {
	ctx, cancel := getCtx()
	defer cancel()

	var err error

	if container == nil {
		if container, err = inspectContainer(containerID); err != nil {
			return nil, fmt.Errorf(`Error while inspecting container: %v`, err)
		}
	}

	if err = docker.ContainerRemove(ctx, containerID, types.ContainerRemoveOptions{RemoveVolumes: true, Force: true}); err != nil {
		return nil, fmt.Errorf(`Error while removing container: %v`, err)
	}

	if err = rmImages(container.Image); err != nil {
		if failOnImageFail {
			return nil, err
		}
		log.Print(err)
	}

	return nil, nil
}

func rmImages(imageID string) error {
	ctx, cancel := getCtx()
	defer cancel()

	if _, err := docker.ImageRemove(ctx, imageID, types.ImageRemoveOptions{}); err != nil {
		return fmt.Errorf(`Error while removing image: %v`, err)
	}

	return nil
}

func invalidAction(action string, _ *types.ContainerJSON) (interface{}, error) {
	return nil, fmt.Errorf(`Unknown action %s`, action)
}

func doAction(action string) func(string, *types.ContainerJSON) (interface{}, error) {
	switch action {
	case getAction:
		return getContainer
	case startAction:
		return startContainer
	case stopAction:
		return stopContainer
	case restartAction:
		return restartContainer
	case deleteAction:
		return rmContainerAndImages
	default:
		return invalidAction
	}
}

func basicActionHandler(w http.ResponseWriter, r *http.Request, user *auth.User, containerID string, action string) {
	if allowed, container, err := isAllowed(user, containerID); err != nil {
		httputils.InternalServerError(w, err)
	} else if !allowed {
		httputils.Forbidden(w)
	} else if result, err := doAction(action)(containerID, container); err != nil {
		httputils.InternalServerError(w, err)
	} else {
		httputils.ResponseJSON(w, http.StatusOK, result, httputils.IsPretty(r.URL.RawQuery))
	}
}

func listContainersHandler(w http.ResponseWriter, r *http.Request, user *auth.User) {
	if containers, err := listContainers(user, ``); err != nil {
		httputils.InternalServerError(w, err)
	} else {
		httputils.ResponseArrayJSON(w, http.StatusOK, containers, httputils.IsPretty(r.URL.RawQuery))
	}
}
