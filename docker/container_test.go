package docker

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
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
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
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
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
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

func TestGetContainer(t *testing.T) {
	var cases = []struct {
		containerID string
		container   *types.ContainerJSON
		want        interface{}
		wantErr     error
	}{
		{
			`test`,
			&types.ContainerJSON{},
			&types.ContainerJSON{},
			nil,
		},
	}

	var failed bool

	for _, testCase := range cases {
		result, err := getContainer(testCase.containerID, testCase.container)

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
			t.Errorf(`getContainer(%v, %v) = (%v, %v), want (%v, %v)`, testCase.containerID, testCase.container, result, err, testCase.want, testCase.wantErr)
		}
	}
}

func TestStartContainer(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		containerID    string
		want           interface{}
		wantErr        error
	}{
		{
			types.ContainerJSON{},
			`test`,
			nil,
			nil,
		},
		{
			nil,
			``,
			nil,
			errors.New(`error during connect: Post http://localhost/containers/start: internal server error`),
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
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
		want           interface{}
		wantErr        error
	}{
		{
			types.ContainerJSON{},
			`test`,
			nil,
			nil,
		},
		{
			nil,
			``,
			nil,
			errors.New(`error during connect: Post http://localhost/containers/stop: internal server error`),
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
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
		want           interface{}
		wantErr        error
	}{
		{
			types.ContainerJSON{},
			`test`,
			nil,
			nil,
		},
		{
			nil,
			``,
			nil,
			errors.New(`error during connect: Post http://localhost/containers/restart: internal server error`),
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
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

func TestRmContainer(t *testing.T) {
	var cases = []struct {
		dockerResponses []interface{}
		containerID     string
		failOnImageFail bool
		container       *types.ContainerJSON
		wantErr         error
	}{
		{
			[]interface{}{},
			`test`,
			true,
			nil,
			errors.New(`Error while inspecting container: error during connect: Get http://localhost/containers/test/json: internal server error`),
		},
		{
			[]interface{}{types.ContainerJSON{ContainerJSONBase: &types.ContainerJSONBase{ID: `test`, Image: `test`}}},
			`test`,
			true,
			nil,
			errors.New(`Error while removing container: error during connect: Delete http://localhost/containers/test?force=1&v=1: internal server error`),
		},
		{
			[]interface{}{types.ContainerJSON{}},
			`test`,
			true,
			&types.ContainerJSON{ContainerJSONBase: &types.ContainerJSONBase{ID: `test`, Image: `test`}},
			errors.New(`Error while removing image: error during connect: Delete http://localhost/images/test?noprune=1: internal server error`),
		},
		{
			[]interface{}{types.ContainerJSON{ContainerJSONBase: &types.ContainerJSONBase{ID: `test`, Image: `test`}}, &types.ContainerJSON{ContainerJSONBase: &types.ContainerJSONBase{ID: `test`, Image: `test`}}},
			`test`,
			true,
			nil,
			errors.New(`Error while removing image: error during connect: Delete http://localhost/images/test?noprune=1: internal server error`),
		},
		{
			[]interface{}{types.ContainerJSON{ContainerJSONBase: &types.ContainerJSONBase{ID: `test`, Image: `test`}}, &types.ContainerJSON{ContainerJSONBase: &types.ContainerJSONBase{ID: `test`, Image: `test`}}},
			`test`,
			false,
			nil,
			nil,
		},
		{
			[]interface{}{types.ContainerJSON{}, []types.ImageDeleteResponseItem{}},
			`test`,
			true,
			&types.ContainerJSON{ContainerJSONBase: &types.ContainerJSONBase{ID: `test`, Image: `test`}},
			nil,
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponses)
		_, err := rmContainer(testCase.containerID, testCase.container, testCase.failOnImageFail)

		failed = false

		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		}

		if failed {
			t.Errorf(`rmContainer(%v, %v, %v) = %v, want %v`, testCase.containerID, testCase.container, testCase.failOnImageFail, err, testCase.wantErr)
		}
	}
}

func TestRmImages(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		imageID        string
		wantErr        error
	}{
		{
			nil,
			`test`,
			errors.New(`Error while removing image: error during connect: Delete http://localhost/images/test?noprune=1: internal server error`),
		},
		{
			[]types.ImageDeleteResponseItem{},
			`test`,
			nil,
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
		err := rmImages(testCase.imageID)

		failed = false

		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		}

		if failed {
			t.Errorf(`rmImages(%v) = (%v), want (%v)`, testCase.imageID, err, testCase.wantErr)
		}
	}
}

func TestDoAction(t *testing.T) {
	var cases = []struct {
		action string
		want   func(string, *types.ContainerJSON) (interface{}, error)
	}{
		{
			getAction,
			getContainer,
		},
		{
			startAction,
			startContainer,
		},
		{
			stopAction,
			stopContainer,
		},
		{
			restartAction,
			restartContainer,
		},
		{
			deleteAction,
			rmContainerAndImages,
		},
		{
			`unknown`,
			invalidAction,
		},
	}

	for _, testCase := range cases {
		if result := doAction(testCase.action); fmt.Sprintf(`%p`, result) != fmt.Sprintf(`%p`, testCase.want) {
			t.Errorf(`doAction(%v) = %p, want %p`, testCase.action, result, testCase.want)
		}
	}
}

func TestBasicActionHandler(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		user           *auth.User
		containerID    string
		action         string
		want           string
		wantStatus     int
	}{
		{
			nil,
			auth.NewUser(`guest`, `guest`),
			`test`,
			getAction,
			`Error while inspecting container: error during connect: Get http://localhost/containers/test/json: internal server error
`,
			http.StatusInternalServerError,
		},
		{
			types.ContainerJSON{Config: &container.Config{}},
			auth.NewUser(`guest`, `guest`),
			`test`,
			getAction,
			`
`,
			http.StatusForbidden,
		},
		{
			types.ContainerJSON{},
			auth.NewUser(`admin`, `admin`),
			`test`,
			`unknown`,
			`Unknown action test
`,
			http.StatusInternalServerError,
		},
		{
			types.ContainerJSON{},
			auth.NewUser(`admin`, `admin`),
			`test`,
			getAction,
			`{"Mounts":null,"Config":null,"NetworkSettings":null}`,
			http.StatusOK,
		},
	}

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
		writer := httptest.NewRecorder()
		basicActionHandler(writer, testCase.user, testCase.containerID, testCase.action)

		if result := writer.Code; result != testCase.wantStatus {
			t.Errorf(`basicActionHandler(%v, %v, %v) = %v, want %v`, testCase.user, testCase.containerID, testCase.action, result, testCase.wantStatus)
		}

		if result, _ := httputils.ReadBody(writer.Result().Body); string(result) != testCase.want {
			t.Errorf(`basicActionHandler(%v, %v, %v) = %v, want %v`, testCase.user, testCase.containerID, testCase.action, string(result), testCase.want)
		}
	}
}

func TestListContainersHandler(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		user           *auth.User
		want           string
		wantStatus     int
	}{
		{
			nil,
			auth.NewUser(`admin`, `admin`),
			`error during connect: Get http://localhost/containers/json?all=1&limit=0: internal server error
`,
			http.StatusInternalServerError,
		},
		{
			[]types.Container{
				{ID: `test`},
			},
			auth.NewUser(`admin`, `admin`),
			`{"results":[{"Id":"test","Names":null,"Image":"","ImageID":"","Command":"","Created":0,"Ports":null,"Labels":null,"State":"","Status":"","HostConfig":{},"NetworkSettings":null,"Mounts":null}]}`,
			http.StatusOK,
		},
	}

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})
		writer := httptest.NewRecorder()

		listContainersHandler(writer, testCase.user)

		if result := writer.Code; result != testCase.wantStatus {
			t.Errorf(`listContainersHandler(%v) = %v, want %v`, testCase.user, result, testCase.wantStatus)
		}

		if result, _ := httputils.ReadBody(writer.Result().Body); string(result) != testCase.want {
			t.Errorf(`listContainersHandler(%v) = %v, want %v`, testCase.user, string(result), testCase.want)
		}
	}
}
