package deploy

import (
	"bufio"
	"context"
	"fmt"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/httputils/pkg/logger"
	"github.com/docker/docker/api/types"
)

func (a *App) serviceOutput(ctx context.Context, user *model.User, appName string, service *deployedService) (logsContent []string, err error) {
	logs, err := a.dockerApp.Docker.ContainerLogs(ctx, service.ContainerID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: false})
	if logs != nil {
		defer func() {
			if closeErr := logs.Close(); closeErr != nil {
				if err != nil {
					err = fmt.Errorf(`%s, and also error while closing logs for service %s: %v`, err, service.Name, closeErr)
				} else {
					err = fmt.Errorf(`error while closing logs for service %s: %v`, service.Name, closeErr)
				}
			}
		}()
	}
	if err != nil {
		err = fmt.Errorf(`error while reading logs for service %s: %v`, service.Name, err)
		return
	}

	logsContent = make([]string, 0)

	scanner := bufio.NewScanner(logs)
	for scanner.Scan() {
		logLine := scanner.Bytes()
		if len(logLine) > commons.IgnoredByteLogSize {
			logsContent = append(logsContent, string(logLine[commons.IgnoredByteLogSize:]))
		}
	}

	return
}

func (a *App) serviceHealthOutput(user *model.User, appName string, service *deployedService, infos *types.ContainerJSON) []string {
	if infos.State.Health == nil {
		return nil
	}

	healthOutput := make([]string, 0)
	for _, log := range infos.State.Health.Log {
		healthOutput = append(healthOutput, fmt.Sprintf(`code=%d, log=%s`, log.ExitCode, log.Output))
	}

	return healthOutput
}

func (a *App) captureServicesHealth(ctx context.Context, user *model.User, appName string, services map[string]*deployedService) {
	for _, service := range services {
		infos, err := a.dockerApp.InspectContainer(ctx, service.ContainerID)
		if err != nil {
			logger.Error(`[%s] [%s] Error while inspecting service %s: %s`, user.Username, appName, service.Name, err)
			continue
		}

		service.HealthLogs = a.serviceHealthOutput(user, appName, service, infos)
	}
}

func (a *App) captureServicesOutput(ctx context.Context, user *model.User, appName string, services map[string]*deployedService) {
	for _, service := range services {
		logs, err := a.serviceOutput(ctx, user, appName, service)
		if err != nil {
			logger.Error(`[%s] [%s] Error while reading logs for service %s: %s`, user.Username, appName, service.Name, err)
		}

		service.Logs = logs
	}
}
