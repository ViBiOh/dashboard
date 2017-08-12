package docker

import (
	"context"
	"fmt"
	"net/http"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
)

const startAction = `start`
const stopAction = `stop`
const restartAction = `restart`
const deleteAction = `delete`

func listContainers(user *auth.User, appName string) ([]types.Container, error) {
	options := types.ContainerListOptions{All: true}

	options.Filters = filters.NewArgs()
	labelFilters(user, &options.Filters, appName)

	return docker.ContainerList(context.Background(), options)
}

func inspectContainer(containerID string) (types.ContainerJSON, error) {
	return docker.ContainerInspect(context.Background(), containerID)
}

func startContainer(containerID string) error {
	return docker.ContainerStart(context.Background(), string(containerID), types.ContainerStartOptions{})
}

func stopContainer(containerID string) error {
	return docker.ContainerStop(context.Background(), containerID, nil)
}

func restartContainer(containerID string) error {
	return docker.ContainerRestart(context.Background(), containerID, nil)
}

func rmContainer(containerID string) error {
	container, err := inspectContainer(containerID)
	if err != nil {
		return fmt.Errorf(`Error while inspecting containers: %v`, err)
	}

	if err := docker.ContainerRemove(context.Background(), containerID, types.ContainerRemoveOptions{RemoveVolumes: true, Force: true}); err != nil {
		return fmt.Errorf(`Error while removing containers: %v`, err)
	}

	return rmImages(container.Image)
}

func rmImages(imageID string) error {
	if _, err := docker.ImageRemove(context.Background(), imageID, types.ImageRemoveOptions{}); err != nil {
		return fmt.Errorf(`Error while removing images: %v`, err)
	}

	return nil
}

func inspectContainerHandler(w http.ResponseWriter, containerID []byte) {
	if container, err := inspectContainer(string(containerID)); err != nil {
		httputils.InternalServer(w, err)
	} else {
		httputils.ResponseJSON(w, container)
	}
}

func getAction(action string) func(string) error {
	switch action {
	case startAction:
		return startContainer
	case stopAction:
		return stopContainer
	case restartAction:
		return restartContainer
	case deleteAction:
		return rmContainer
	default:
		return func(string) error {
			return fmt.Errorf(`Unknown action %s`, action)
		}
	}
}

func basicActionHandler(w http.ResponseWriter, user *auth.User, containerID []byte, action string) {
	id := string(containerID)

	if allowed, err := isAllowed(user, id); err != nil {
		httputils.InternalServer(w, err)
	} else if !allowed {
		httputils.Forbidden(w)
	} else if err = getAction(action)(id); err != nil {
		httputils.InternalServer(w, err)
	} else {
		w.Write(nil)
	}
}

func listContainersHandler(w http.ResponseWriter, user *auth.User) {
	if containers, err := listContainers(user, ``); err != nil {
		httputils.InternalServer(w, err)
	} else {
		httputils.ResponseArrayJSON(w, containers)
	}
}
