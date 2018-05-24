package docker

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/httputils/pkg/httperror"
	"github.com/ViBiOh/httputils/pkg/httpjson"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	opentracing "github.com/opentracing/opentracing-go"
)

const (
	getAction     = `get`
	startAction   = `start`
	stopAction    = `stop`
	restartAction = `restart`
	deleteAction  = `delete`
)

// ListContainers list containers for user and app if provided
func (a *App) ListContainers(ctx context.Context, user *model.User, appName string) ([]types.Container, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, `Docker list`)
	defer span.Finish()
	span.SetTag(`user`, user.Username)
	span.SetTag(`app`, appName)

	options := types.ContainerListOptions{All: true}

	options.Filters = filters.NewArgs()
	LabelFilters(user, &options.Filters, appName)

	return a.Docker.ContainerList(ctx, options)
}

// InspectContainer get detailed information of a container
func (a *App) InspectContainer(ctx context.Context, containerID string) (*types.ContainerJSON, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, `Docker inspect`)
	defer span.Finish()
	span.SetTag(`id`, containerID)

	container, err := a.Docker.ContainerInspect(ctx, containerID)
	return &container, err
}

func getContainer(_ context.Context, containerID string, container *types.ContainerJSON) (interface{}, error) {
	return container, nil
}

// StartContainer start a container
func (a *App) StartContainer(ctx context.Context, containerID string, _ *types.ContainerJSON) (interface{}, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, `Docker start`)
	defer span.Finish()
	span.SetTag(`id`, containerID)

	return nil, a.Docker.ContainerStart(ctx, containerID, types.ContainerStartOptions{})
}

// StopContainer stop a container
func (a *App) StopContainer(ctx context.Context, containerID string, _ *types.ContainerJSON) (interface{}, error) {
	return a.GracefulStopContainer(ctx, containerID, commons.DefaultTimeout)
}

// GracefulStopContainer stop a container
func (a *App) GracefulStopContainer(ctx context.Context, containerID string, gracefulTimeout time.Duration) (interface{}, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, `Docker stop`)
	defer span.Finish()
	span.SetTag(`id`, containerID)

	timeoutCtx, cancel := context.WithTimeout(ctx, gracefulTimeout)
	defer cancel()

	return nil, a.Docker.ContainerStop(timeoutCtx, containerID, &gracefulTimeout)
}

// RestartContainer restarts a container
func (a *App) RestartContainer(ctx context.Context, containerID string, _ *types.ContainerJSON) (interface{}, error) {
	return a.GracefulRestartContainer(ctx, containerID, commons.DefaultTimeout)
}

// GracefulRestartContainer stop a container
func (a *App) GracefulRestartContainer(ctx context.Context, containerID string, gracefulTimeout time.Duration) (interface{}, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, `Docker restart`)
	defer span.Finish()
	span.SetTag(`id`, containerID)

	timeoutCtx, cancel := context.WithTimeout(ctx, gracefulTimeout)
	defer cancel()

	return nil, a.Docker.ContainerRestart(timeoutCtx, containerID, &gracefulTimeout)
}

// RmContainerAndImages clean env
func (a *App) RmContainerAndImages(ctx context.Context, containerID string, container *types.ContainerJSON) (interface{}, error) {
	return a.RmContainer(ctx, containerID, container, true)
}

// RmContainer remove a container
func (a *App) RmContainer(ctx context.Context, containerID string, container *types.ContainerJSON, failOnImageFail bool) (interface{}, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, `Docker rm`)
	defer span.Finish()
	span.SetTag(`id`, containerID)

	var err error

	if container == nil {
		if container, err = a.InspectContainer(ctx, containerID); err != nil {
			return nil, fmt.Errorf(`Error while inspecting container: %v`, err)
		}
	}

	if err = a.Docker.ContainerRemove(ctx, containerID, types.ContainerRemoveOptions{RemoveVolumes: true, Force: true}); err != nil {
		return nil, fmt.Errorf(`Error while removing container: %v`, err)
	}

	if err = a.RmImage(ctx, container.Image); err != nil {
		if failOnImageFail {
			return nil, err
		}
		log.Print(err)
	}

	return nil, nil
}

// RmImage remove image
func (a *App) RmImage(ctx context.Context, imageID string) error {
	span, ctx := opentracing.StartSpanFromContext(ctx, `Docker rmi`)
	defer span.Finish()
	span.SetTag(`id`, imageID)

	if _, err := a.Docker.ImageRemove(ctx, imageID, types.ImageRemoveOptions{}); err != nil {
		return fmt.Errorf(`Error while removing image: %v`, err)
	}

	return nil
}

func invalidAction(_ context.Context, action string, _ *types.ContainerJSON) (interface{}, error) {
	return nil, fmt.Errorf(`Unknown action %s`, action)
}

func (a *App) doAction(action string) func(context.Context, string, *types.ContainerJSON) (interface{}, error) {
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
	ctx, cancel := commons.GetCtx(r.Context())
	defer cancel()

	allowed, container, err := a.isAllowed(ctx, user, containerID)
	if err != nil {
		httperror.InternalServerError(w, err)
		return
	}

	if !allowed {
		httperror.Forbidden(w)
		return
	}

	result, err := a.doAction(action)(ctx, containerID, container)
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
	ctx, cancel := commons.GetCtx(r.Context())
	defer cancel()

	containers, err := a.ListContainers(ctx, user, ``)
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
