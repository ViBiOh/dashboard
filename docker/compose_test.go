package docker

import (
	"reflect"
	"testing"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
)

func TestGetConfig(t *testing.T) {
	var tests = []struct {
		service *dockerComposeService
		user    *auth.User
		appName string
		want    *container.Config
	}{
		{
			&dockerComposeService{},
			auth.NewUser(`admin`, `admin`),
			`test`,
			&container.Config{
				Labels: map[string]string{`owner`: `admin`, `app`: `test`},
				Env:    []string{},
			},
		},
		{
			&dockerComposeService{
				Image:       `vibioh/dashboard`,
				Environment: map[string]string{`PATH`: `/usr/bin`},
				Labels:      map[string]string{`CUSTOM_LABEL`: `testing`},
				Command:     []string{`entrypoint.sh`, `start`},
			},
			auth.NewUser(`admin`, `admin`),
			`test`,
			&container.Config{
				Image:  `vibioh/dashboard`,
				Labels: map[string]string{`CUSTOM_LABEL`: `testing`, `owner`: `admin`, `app`: `test`},
				Env:    []string{`PATH=/usr/bin`},
				Cmd:    []string{`entrypoint.sh`, `start`},
			},
		},
	}

	for _, test := range tests {
		if result := getConfig(test.service, test.user, test.appName); !reflect.DeepEqual(result, test.want) {
			t.Errorf(`getConfig(%v, %v, %v) = %v, want %v`, test.service, test.user, test.appName, result, test.want)
		}
	}
}

func TestGetHostConfig(t *testing.T) {
	var tests = []struct {
		service *dockerComposeService
		want    *container.HostConfig
	}{
		{
			&dockerComposeService{},
			&container.HostConfig{
				LogConfig: container.LogConfig{Type: `json-file`, Config: map[string]string{
					`max-size`: `50m`,
				}},
				NetworkMode:   networkMode,
				RestartPolicy: container.RestartPolicy{Name: `on-failure`, MaximumRetryCount: 5},
				Resources: container.Resources{
					CPUShares: 128,
					Memory:    minMemory,
				},
				SecurityOpt: []string{`no-new-privileges`},
			},
		},
		{
			&dockerComposeService{
				ReadOnly:    true,
				CPUShares:   512,
				MemoryLimit: 33554432,
			},
			&container.HostConfig{
				LogConfig: container.LogConfig{Type: `json-file`, Config: map[string]string{
					`max-size`: `50m`,
				}},
				NetworkMode:    networkMode,
				RestartPolicy:  container.RestartPolicy{Name: `on-failure`, MaximumRetryCount: 5},
				ReadonlyRootfs: true,
				Resources: container.Resources{
					CPUShares: 512,
					Memory:    33554432,
				},
				SecurityOpt: []string{`no-new-privileges`},
			},
		},
		{
			&dockerComposeService{
				ReadOnly:    true,
				CPUShares:   512,
				MemoryLimit: 20973619200,
			},
			&container.HostConfig{
				LogConfig: container.LogConfig{Type: `json-file`, Config: map[string]string{
					`max-size`: `50m`,
				}},
				NetworkMode:    networkMode,
				RestartPolicy:  container.RestartPolicy{Name: `on-failure`, MaximumRetryCount: 5},
				ReadonlyRootfs: true,
				Resources: container.Resources{
					CPUShares: 512,
					Memory:    maxMemory,
				},
				SecurityOpt: []string{`no-new-privileges`},
			},
		},
	}

	for _, test := range tests {
		if result := getHostConfig(test.service); !reflect.DeepEqual(result, test.want) {
			t.Errorf(`getHostConfig(%v) = %v, want %v`, test.service, result, test.want)
		}
	}
}

func TestGetNetworkConfig(t *testing.T) {
	var tests = []struct {
		service          *dockerComposeService
		deployedServices map[string]*deployedService
		want             *network.NetworkingConfig
	}{
		{
			&dockerComposeService{},
			nil,
			&network.NetworkingConfig{
				EndpointsConfig: map[string]*network.EndpointSettings{
					networkMode: {},
				},
			},
		},
		{
			&dockerComposeService{
				Links: []string{`db`},
			},
			nil,
			&network.NetworkingConfig{
				EndpointsConfig: map[string]*network.EndpointSettings{
					networkMode: {
						Links: []string{`db:db`},
					},
				},
			},
		},
		{
			&dockerComposeService{
				Links: []string{`db`},
			},
			map[string]*deployedService{`db`: {Name: `test_postgres_deploy`}},
			&network.NetworkingConfig{
				EndpointsConfig: map[string]*network.EndpointSettings{
					networkMode: {
						Links: []string{`test_postgres:db`},
					},
				},
			},
		},
		{
			&dockerComposeService{
				Links: []string{`db:postgres`},
			},
			nil,
			&network.NetworkingConfig{
				EndpointsConfig: map[string]*network.EndpointSettings{
					networkMode: {
						Links: []string{`db:postgres`},
					},
				},
			},
		},
	}

	for _, test := range tests {
		if result := getNetworkConfig(test.service, test.deployedServices); !reflect.DeepEqual(result, test.want) {
			t.Errorf(`getNetworkConfig(%v, %v) = %v, want %v`, test.service, test.deployedServices, result, test.want)
		}
	}
}

func TestGetServiceFullName(t *testing.T) {
	var tests = []struct {
		app     string
		service string
		want    string
	}{
		{
			`dashboard`,
			`api`,
			`dashboard_api_deploy`,
		},
	}

	for _, test := range tests {
		if result := getServiceFullName(test.app, test.service); result != test.want {
			t.Errorf(`getServiceFullName(%v, %v) = %v, want %v`, test.app, test.service, result, test.want)
		}
	}
}

func TestGetFinalName(t *testing.T) {
	var tests = []struct {
		serviceFullName string
		want            string
	}{
		{
			`dashboard_deploy`,
			`dashboard`,
		},
		{
			`dashboard`,
			`dashboard`,
		},
	}

	for _, test := range tests {
		if result := getFinalName(test.serviceFullName); result != test.want {
			t.Errorf(`getFinalName(%v) = %v, want %v`, test.serviceFullName, result, test.want)
		}
	}
}
