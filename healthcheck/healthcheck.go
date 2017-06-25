package healthcheck

import (
	"fmt"
	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/dashboard/httpclient"
	"github.com/docker/docker/api/types"
	"log"
	"net/http"
	"time"
)

const httpPrefix = `http://`
const portSeparator = `:`
const traefikHealthCheckLabel = `traefik.backend.healthcheck.path`
const traefikPortLabel = `traefik.port`
const waitTime = 10 * time.Second
const maxHealthCheckTry = 8

// TraefikContainers Check health of given containers based on Traefik labels
func TraefikContainers(containers []*types.ContainerJSON, network string, user *auth.User) bool {
	healthCheckSuccess := make(map[string]bool)

	sleepDuration := waitTime

	for i := 0; i < maxHealthCheckTry; i++ {
		if i != 0 {
			time.Sleep(sleepDuration)
			sleepDuration = sleepDuration * 2
		}

		for _, container := range containers {
			if !container.State.Running {
				healthCheckFail(container.Name, `container is not running`, user)
			} else if !healthCheckSuccess[container.ID] && traefikContainer(container, network, user) {
				healthCheckSuccess[container.ID] = true
			}
		}

		if len(healthCheckSuccess) == len(containers) {
			return true
		}
	}

	return false
}

func healthCheckFail(name string, reason interface{}, user *auth.User) bool {
	log.Printf(`[%s] Health check failed for container %s: %v`, user.Username, name, reason)
	return false
}

func traefikContainer(container *types.ContainerJSON, network string, user *auth.User) bool {
	if container.Config.Labels[traefikHealthCheckLabel] != `` {
		log.Printf(`[%s] Checking health of container %s`, user.Username, container.Name)

		statusCode, err := httpclient.GetStatusCode(httpPrefix + container.NetworkSettings.Networks[network].IPAddress + portSeparator + container.Config.Labels[traefikPortLabel] + container.Config.Labels[traefikHealthCheckLabel])
		if err != nil {
			return healthCheckFail(container.Name, err, user)
		}

		if statusCode != http.StatusOK {
			return healthCheckFail(container.Name, fmt.Sprintf(`HTTP/%d`, statusCode), user)
		}
	}

	return true
}
