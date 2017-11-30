package docker

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"

	"github.com/ViBiOh/auth/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
)

func TestGetConfig(t *testing.T) {
	var cases = []struct {
		service *dockerComposeService
		user    *auth.User
		appName string
		want    *container.Config
		wantErr error
	}{
		{
			&dockerComposeService{
				Healthcheck: &dockerComposeHealthcheck{
					Interval: `abcd`,
				},
			},
			auth.NewUser(0, `admin`, `admin`),
			`test`,
			nil,
			errors.New(`Error while parsing healthcheck interval: time: invalid duration abcd`),
		},
		{
			&dockerComposeService{
				Healthcheck: &dockerComposeHealthcheck{
					Interval: `30s`,
					Timeout:  `abcd`,
				},
			},
			auth.NewUser(0, `admin`, `admin`),
			`test`,
			nil,
			errors.New(`Error while parsing healthcheck timeout: time: invalid duration abcd`),
		},
		{
			&dockerComposeService{},
			auth.NewUser(0, `admin`, `admin`),
			`test`,
			&container.Config{
				Labels: map[string]string{`owner`: `admin`, `app`: `test`},
				Env:    []string{},
			},
			nil,
		},
		{
			&dockerComposeService{
				Image:       `vibioh/dashboard`,
				Environment: map[string]string{`PATH`: `/usr/bin`},
				Labels:      map[string]string{`CUSTOM_LABEL`: `testing`},
				Command:     []string{`entrypoint.sh`, `start`},
				Healthcheck: &dockerComposeHealthcheck{
					Test:     []string{`CMD`, `alcotest`},
					Retries:  10,
					Interval: `30s`,
					Timeout:  `10s`,
				},
			},
			auth.NewUser(0, `admin`, `admin`),
			`test`,
			&container.Config{
				Image:  `vibioh/dashboard`,
				Labels: map[string]string{`CUSTOM_LABEL`: `testing`, `owner`: `admin`, `app`: `test`},
				Env:    []string{`PATH=/usr/bin`},
				Cmd:    []string{`entrypoint.sh`, `start`},
				Healthcheck: &container.HealthConfig{
					Test:     []string{`CMD`, `alcotest`},
					Retries:  10,
					Interval: time.Second * 30,
					Timeout:  time.Second * 10,
				},
			},
			nil,
		},
	}

	var failed bool

	for _, testCase := range cases {
		result, err := getConfig(testCase.service, testCase.user, testCase.appName)

		failed = false

		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		} else if !reflect.DeepEqual(result, testCase.want) {
			failed = true
		}

		if failed {
			t.Errorf(`getConfig(%v, %v, %v) = (%v, %v), want (%v, %v)`, testCase.service, testCase.user, testCase.appName, result, err, testCase.want, testCase.wantErr)
		}
	}
}

func TestGetHostConfig(t *testing.T) {
	var cases = []struct {
		service *dockerComposeService
		want    *container.HostConfig
	}{
		{
			&dockerComposeService{},
			&container.HostConfig{
				LogConfig: container.LogConfig{Type: `json-file`, Config: map[string]string{
					`max-size`: `10m`,
				}},
				NetworkMode:   container.NetworkMode(*dockerNetwork),
				RestartPolicy: container.RestartPolicy{Name: `on-failure`, MaximumRetryCount: 5},
				Resources: container.Resources{
					CPUShares: defaultCPUShares,
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
					`max-size`: `10m`,
				}},
				NetworkMode:    container.NetworkMode(*dockerNetwork),
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
					`max-size`: `10m`,
				}},
				NetworkMode:    container.NetworkMode(*dockerNetwork),
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

	for _, testCase := range cases {
		if result := getHostConfig(testCase.service, nil); !reflect.DeepEqual(result, testCase.want) {
			t.Errorf(`getHostConfig(%v) = %v, want %v`, testCase.service, result, testCase.want)
		}
	}
}

func TestGetNetworkConfig(t *testing.T) {
	var cases = []struct {
		service *dockerComposeService
		want    *network.NetworkingConfig
	}{
		{
			&dockerComposeService{},
			&network.NetworkingConfig{
				EndpointsConfig: map[string]*network.EndpointSettings{
					*dockerNetwork: {
						Aliases: []string{`service`},
					},
				},
			},
		},
		{
			&dockerComposeService{
				Links: []string{`db`},
			},
			&network.NetworkingConfig{
				EndpointsConfig: map[string]*network.EndpointSettings{
					*dockerNetwork: {
						Aliases: []string{`service`},
						Links:   []string{`db:db`},
					},
				},
			},
		},
		{
			&dockerComposeService{
				Links: []string{`postgres:db`},
			},
			&network.NetworkingConfig{
				EndpointsConfig: map[string]*network.EndpointSettings{
					*dockerNetwork: {
						Aliases: []string{`service`},
						Links:   []string{`postgres:db`},
					},
				},
			},
		},
		{
			&dockerComposeService{
				Links: []string{`db:postgres`},
			},
			&network.NetworkingConfig{
				EndpointsConfig: map[string]*network.EndpointSettings{
					*dockerNetwork: {
						Aliases: []string{`service`},
						Links:   []string{`db:postgres`},
					},
				},
			},
		},
	}

	for _, testCase := range cases {
		if result := getNetworkConfig(`service`, testCase.service); !reflect.DeepEqual(result, testCase.want) {
			t.Errorf(`getNetworkConfig(%+v) = %+v, want %+v`, testCase.service, result.EndpointsConfig[`traefik`], testCase.want.EndpointsConfig[`traefik`])
		}
	}
}

func TestGetServiceFullName(t *testing.T) {
	var cases = []struct {
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

	for _, testCase := range cases {
		if result := getServiceFullName(testCase.app, testCase.service); result != testCase.want {
			t.Errorf(`getServiceFullName(%v, %v) = %v, want %v`, testCase.app, testCase.service, result, testCase.want)
		}
	}
}

func TestGetFinalName(t *testing.T) {
	var cases = []struct {
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

	for _, testCase := range cases {
		if result := getFinalName(testCase.serviceFullName); result != testCase.want {
			t.Errorf(`getFinalName(%v) = %v, want %v`, testCase.serviceFullName, result, testCase.want)
		}
	}
}

func TestComposeFailed(t *testing.T) {
	var cases = []struct {
		user       *auth.User
		appName    string
		err        error
		want       string
		wantStatus int
	}{
		{
			auth.NewUser(0, `admin`, `admin`),
			`test`,
			errors.New(`test unit error`),
			`[admin] [test] Failed to deploy: test unit error
`,
			http.StatusInternalServerError,
		},
	}

	for _, testCase := range cases {
		writer := httptest.NewRecorder()

		composeFailed(writer, testCase.user, testCase.appName, testCase.err)

		if result := writer.Code; result != testCase.wantStatus {
			t.Errorf(`composeFailed(%v, %v, %v) = %v, want %v`, testCase.user, testCase.appName, testCase.err, result, testCase.wantStatus)
		}

		if result, _ := httputils.ReadBody(writer.Result().Body); string(result) != testCase.want {
			t.Errorf(`composeFailed(%v, %v, %v) = %v, want %v`, testCase.user, testCase.appName, testCase.err, string(result), testCase.want)
		}
	}
}
