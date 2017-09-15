package docker

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types"
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
			auth.NewUser(`admin`, `admin`),
			`test`,
			nil,
			fmt.Errorf(`Error while parsing healthcheck interval: time: invalid duration abcd`),
		},
		{
			&dockerComposeService{
				Healthcheck: &dockerComposeHealthcheck{
					Interval: `30s`,
					Timeout:  `abcd`,
				},
			},
			auth.NewUser(`admin`, `admin`),
			`test`,
			nil,
			fmt.Errorf(`Error while parsing healthcheck timeout: time: invalid duration abcd`),
		},
		{
			&dockerComposeService{},
			auth.NewUser(`admin`, `admin`),
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
			auth.NewUser(`admin`, `admin`),
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

	for _, testCase := range cases {
		if result := getHostConfig(testCase.service); !reflect.DeepEqual(result, testCase.want) {
			t.Errorf(`getHostConfig(%v) = %v, want %v`, testCase.service, result, testCase.want)
		}
	}
}

func TestGetNetworkConfig(t *testing.T) {
	var cases = []struct {
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

	for _, testCase := range cases {
		if result := getNetworkConfig(testCase.service, testCase.deployedServices); !reflect.DeepEqual(result, testCase.want) {
			t.Errorf(`getNetworkConfig(%v, %v) = %v, want %v`, testCase.service, testCase.deployedServices, result, testCase.want)
		}
	}
}

func TestPullImage(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		image          string
		wantErr        error
	}{
		{
			nil,
			`test`,
			errors.New(`Error while pulling image: error during connect: Post http://localhost/images/create?fromImage=test&tag=latest: internal server error`),
		},
		{
			types.ContainerJSON{},
			`test`,
			nil,
		},
		{
			types.ContainerJSON{},
			`test:version`,
			nil,
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
		err := pullImage(testCase.image)

		failed = false

		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		}

		if failed {
			t.Errorf(`pullImage(%v) = %v, want %v`, testCase.image, err, testCase.wantErr)
		}
	}
}

func TestCleanContainers(t *testing.T) {
	var cases = []struct {
		dockerResponses []interface{}
		containers      []types.Container
		wantErr         error
	}{
		{
			nil,
			nil,
			nil,
		},
		{
			nil,
			[]types.Container{{Names: []string{`test`}}},
			errors.New(`Error while stopping container [test]: error during connect: Post http://localhost/containers/stop: internal server error`),
		},
		{
			[]interface{}{types.ContainerJSON{}},
			[]types.Container{{Names: []string{`test`}}},
			errors.New(`Error while deleting container [test]: Error while inspecting container: error during connect: Get http://localhost/containers/json: internal server error`),
		},
		{
			[]interface{}{types.ContainerJSON{}, types.ContainerJSON{ContainerJSONBase: &types.ContainerJSONBase{ID: `test`, Image: `test`}}, types.ContainerJSON{}, []types.ImageDeleteResponseItem{}},
			[]types.Container{{Names: []string{`test`}}},
			nil,
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponses)
		err := cleanContainers(testCase.containers)

		failed = false

		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		}

		if failed {
			t.Errorf(`cleanContainers(%v) = %v, want %v`, testCase.containers, err, testCase.wantErr)
		}
	}
}

func TestRenameDeployedContainers(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		containers     map[string]*deployedService
		wantErr        error
	}{
		{
			nil,
			nil,
			nil,
		},
		{
			nil,
			map[string]*deployedService{`test`: {}},
			errors.New(`Error while renaming container test: error during connect: Post http://localhost/containers/rename?name=: internal server error`),
		},
		{
			types.ContainerJSON{},
			map[string]*deployedService{`test`: {}},
			nil,
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
		err := renameDeployedContainers(testCase.containers)

		failed = false

		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		}

		if failed {
			t.Errorf(`renameDeployedContainers(%v) = %v, want %v`, testCase.containers, err, testCase.wantErr)
		}
	}
}

func TestStartServices(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		services       map[string]*deployedService
		wantErr        error
	}{
		{
			nil,
			nil,
			nil,
		},
		{
			nil,
			map[string]*deployedService{`test`: {}},
			errors.New(`Error while starting service test: error during connect: Post http://localhost/containers/start: internal server error`),
		},
		{
			types.ContainerJSON{},
			map[string]*deployedService{`test`: {}},
			nil,
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
		err := startServices(testCase.services)

		failed = false

		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		}

		if failed {
			t.Errorf(`startServices(%v) = (%v), want (%v)`, testCase.services, err, testCase.wantErr)
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

func TestInspectServices(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		services       map[string]*deployedService
		user           *auth.User
		appName        string
		want           []*types.ContainerJSON
	}{
		{
			nil,
			nil,
			nil,
			``,
			[]*types.ContainerJSON{},
		},
		{
			nil,
			map[string]*deployedService{`test`: {}},
			auth.NewUser(`admin`, `admin`),
			`test`,
			[]*types.ContainerJSON{},
		},
		{
			types.ContainerJSON{},
			map[string]*deployedService{`test`: {}},
			auth.NewUser(`admin`, `admin`),
			`test`,
			[]*types.ContainerJSON{{}},
		},
	}

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})

		if result := inspectServices(testCase.services, testCase.user, testCase.appName); !reflect.DeepEqual(result, testCase.want) {
			t.Errorf(`inspectServices(%v, %v, %v) = %v, want %v`, testCase.services, testCase.user, testCase.appName, result, testCase.want)
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
			auth.NewUser(`admin`, `admin`),
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
