package docker

import (
	"errors"
	"reflect"
	"testing"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types"
)

func TestListContainers(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		user           *auth.User
		appName        string
		want           []types.Container
		wantErr        error
	}{
		{
			[]types.Container{
				{ID: `test`},
			},
			auth.NewUser(`admin`, `admin`),
			``,
			[]types.Container{
				{ID: `test`},
			},
			nil,
		},
		{
			nil,
			auth.NewUser(`guest`, `guest`),
			``,
			nil,
			errors.New(`error during connect: Get http://localhost/containers/json?all=1&filters=%7B%22label%22%3A%7B%22owner%3Dguest%22%3Atrue%7D%7D&limit=0: internal server error`),
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponse)
		result, err := listContainers(testCase.user, testCase.appName)

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
			t.Errorf(`listContainers(%v, %v) = (%v, %v), want (%v, %v)`, testCase.user, testCase.appName, result, err, testCase.want, testCase.wantErr)
		}
	}
}

func TestInspectContainer(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		containerID    string
		want           *types.ContainerJSON
		wantErr        error
	}{
		{
			types.ContainerJSON{},
			`test`,
			&types.ContainerJSON{},
			nil,
		},
		{
			nil,
			``,
			&types.ContainerJSON{},
			errors.New(`error during connect: Get http://localhost/containers/json: internal server error`),
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponse)
		result, err := inspectContainer(testCase.containerID)

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
			t.Errorf(`inspectContainer(%v) = (%v, %v), want (%v, %v)`, testCase.containerID, result, err, testCase.want, testCase.wantErr)
		}
	}
}

func TestStartContainer(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		containerID    string
		wantErr        error
	}{
		{
			types.ContainerJSON{},
			`test`,
			nil,
		},
		{
			nil,
			``,
			errors.New(`error during connect: Post http://localhost/containers/start: internal server error`),
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponse)
		_, err := startContainer(testCase.containerID, nil)

		failed = false
		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		}

		if failed {
			t.Errorf(`startContainer(%v) = (%v), want (%v)`, testCase.containerID, err, testCase.wantErr)
		}
	}
}

func TestStopContainer(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		containerID    string
		wantErr        error
	}{
		{
			types.ContainerJSON{},
			`test`,
			nil,
		},
		{
			nil,
			``,
			errors.New(`error during connect: Post http://localhost/containers/stop: internal server error`),
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponse)
		_, err := stopContainer(testCase.containerID, nil)

		failed = false
		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		}

		if failed {
			t.Errorf(`stopContainer(%v) = (%v), want (%v)`, testCase.containerID, err, testCase.wantErr)
		}
	}
}

func TestRestartContainer(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		containerID    string
		wantErr        error
	}{
		{
			types.ContainerJSON{},
			`test`,
			nil,
		},
		{
			nil,
			``,
			errors.New(`error during connect: Post http://localhost/containers/restart: internal server error`),
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponse)
		_, err := restartContainer(testCase.containerID, nil)

		failed = false
		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		}

		if failed {
			t.Errorf(`restartContainer(%v) = (%v), want (%v)`, testCase.containerID, err, testCase.wantErr)
		}
	}
}
