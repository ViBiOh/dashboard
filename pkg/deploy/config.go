package deploy

import (
	"fmt"
	"strings"
	"time"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/httputils/pkg/errors"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/network"
)

func getHealthcheckConfig(healthcheck *dockerComposeHealthcheck) (*container.HealthConfig, error) {
	healthconfig := container.HealthConfig{
		Test:    healthcheck.Test,
		Retries: healthcheck.Retries,
	}

	if strings.TrimSpace(healthcheck.Interval) != `` {
		interval, err := time.ParseDuration(healthcheck.Interval)
		if err != nil {
			return nil, errors.WithStack(err)
		}

		healthconfig.Interval = interval
	}

	if strings.TrimSpace(healthcheck.Timeout) != `` {
		timeout, err := time.ParseDuration(healthcheck.Timeout)
		if err != nil {
			return nil, errors.WithStack(err)
		}

		healthconfig.Timeout = timeout
	}

	return &healthconfig, nil
}

func (a *App) getConfig(service *dockerComposeService, user *model.User, appName string) (*container.Config, error) {
	environments := make([]string, 0, len(service.Environment))
	for key, value := range service.Environment {
		environments = append(environments, fmt.Sprintf(`%s=%s`, key, value))
	}

	if service.Labels == nil {
		service.Labels = make(map[string]string)
	}

	service.Labels[commons.OwnerLabel] = user.Username
	service.Labels[commons.AppLabel] = appName

	config := container.Config{
		Hostname: service.Hostname,
		Image:    service.Image,
		Labels:   service.Labels,
		Env:      environments,
		User:     service.User,
	}

	if config.User == `` {
		config.User = a.containerUser
	}

	if len(service.Command) != 0 {
		config.Cmd = service.Command
	}

	if service.Healthcheck != nil {
		healthcheck, err := getHealthcheckConfig(service.Healthcheck)
		if err != nil {
			return nil, err
		}

		config.Healthcheck = healthcheck
	}

	return &config, nil
}

func getVolumesConfig(hostConfig *container.HostConfig, volumes []string) {
	for _, rawVolume := range volumes {
		parts := strings.Split(rawVolume, colonSeparator)

		if len(parts) > 1 && parts[0] != `/` && parts[0] != `/var/run/docker.sock` {
			volume := mount.Mount{Type: mount.TypeBind, BindOptions: &mount.BindOptions{Propagation: mount.PropagationRPrivate}, Source: parts[0], Target: parts[1]}
			if len(parts) > 2 && parts[2] == `ro` {
				volume.ReadOnly = true
			}

			hostConfig.Mounts = append(hostConfig.Mounts, volume)
		}
	}
}

func (a *App) getHostConfig(service *dockerComposeService, user *model.User) *container.HostConfig {
	hostConfig := container.HostConfig{
		LogConfig: container.LogConfig{Type: `json-file`, Config: map[string]string{
			`max-size`: `10m`,
		}},
		NetworkMode:   container.NetworkMode(a.network),
		RestartPolicy: container.RestartPolicy{Name: `on-failure`, MaximumRetryCount: 5},
		Resources: container.Resources{
			CPUShares: defaultCPUShares,
			Memory:    minMemory,
		},
		SecurityOpt: []string{`no-new-privileges`},
		DNS:         service.DNS,
	}

	if service.ReadOnly {
		hostConfig.ReadonlyRootfs = true
	}

	if service.CPUShares != 0 {
		hostConfig.Resources.CPUShares = service.CPUShares
	}

	if service.MemoryLimit != 0 {
		if service.MemoryLimit <= maxMemory {
			hostConfig.Resources.Memory = service.MemoryLimit
		} else {
			hostConfig.Resources.Memory = maxMemory
		}
	}

	if docker.IsAdmin(user) {
		if len(service.Volumes) > 0 {
			getVolumesConfig(&hostConfig, service.Volumes)
		}

		if len(service.CapAdd) > 0 {
			hostConfig.CapAdd = service.CapAdd
		}
	}

	return &hostConfig
}

func addLinks(settings *network.EndpointSettings, links []string) {
	for _, link := range links {
		linkParts := strings.Split(link, colonSeparator)
		target := linkParts[0]
		alias := linkParts[0]

		if len(linkParts) > 1 {
			alias = linkParts[1]
		}

		settings.Links = append(settings.Links, fmt.Sprintf(`%s%s%s`, target, colonSeparator, alias))
	}
}

func (a *App) getNetworkConfig(serviceName string, service *dockerComposeService) *network.NetworkingConfig {
	endpointConfig := network.EndpointSettings{}
	endpointConfig.Aliases = append(endpointConfig.Aliases, serviceName)

	addLinks(&endpointConfig, service.Links)
	addLinks(&endpointConfig, service.ExternalLinks)

	return &network.NetworkingConfig{
		EndpointsConfig: map[string]*network.EndpointSettings{
			a.network: &endpointConfig,
		},
	}
}
