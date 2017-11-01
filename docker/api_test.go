package docker

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/ViBiOh/auth/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types"
)

func Test_CanBeGracefullyClosed(t *testing.T) {
	var cases = []struct {
		intention       string
		backgroundTasks map[string]bool
		want            bool
	}{
		{
			`should allow graceful if no current deployment`,
			map[string]bool{`dashboard`: false},
			true,
		},
		{
			`should disallow if deployment running`,
			map[string]bool{`dashboard`: false, `test`: true},
			false,
		},
	}

	for _, testCase := range cases {
		backgroundTasks = sync.Map{}
		for key, value := range testCase.backgroundTasks {
			backgroundTasks.Store(key, value)
		}

		if result := CanBeGracefullyClosed(); result != testCase.want {
			t.Errorf("%s\nCanBeGracefullyClosed() = %+v, want %+v, with %+v", testCase.intention, result, testCase.want, testCase.backgroundTasks)
		}
	}
}

func Test_HealthHandler(t *testing.T) {
	var cases = []struct {
		intention      string
		dockerResponse interface{}
		docker         bool
		want           int
	}{
		{
			`should return unavailable if no docker client`,
			nil,
			false,
			http.StatusServiceUnavailable,
		},
		{
			`should return unavailable if ping failed`,
			nil,
			true,
			http.StatusServiceUnavailable,
		},
		{
			`should return ok if ping succeed`,
			&types.Ping{},
			true,
			http.StatusOK,
		},
	}

	for _, testCase := range cases {
		if testCase.docker {
			docker = mockClient(t, []interface{}{testCase.dockerResponse})
		} else {
			docker = nil
		}
		w := httptest.NewRecorder()

		healthHandler(w, nil)

		if result := w.Result().StatusCode; result != testCase.want {
			t.Errorf("%s\nhealthHandler() = %+v, want %+v, with docker=%+v", testCase.intention, result, testCase.want, testCase.docker)
		}
	}
}

func Test_InfoHandler(t *testing.T) {
	var cases = []struct {
		intention      string
		dockerResponse interface{}
		want           int
	}{
		{
			`should fail if no response from daemon`,
			nil,
			500,
		},
		{
			`should return JSON informations`,
			&types.Info{ID: "test ID", Containers: 3},
			200,
		},
	}

	for _, testCase := range cases {
		docker = mockClient(t, []interface{}{testCase.dockerResponse})

		w := httptest.NewRecorder()
		infoHandler(w, httptest.NewRequest(http.MethodGet, `/`, nil))

		if result := w.Result().StatusCode; result != testCase.want {
			t.Errorf("%s\ninfoHandler() = %+v, want %+v", testCase.intention, result, testCase.want)
		}
	}
}

func Test_ContainersHandler(t *testing.T) {
	var cases = []struct {
		intention       string
		dockerResponses []interface{}
		response        *http.Request
		urlPath         string
		user            *auth.User
		want            string
		wantStatus      int
	}{
		{
			`should handle not found path`,
			nil,
			httptest.NewRequest(http.MethodHead, `/`, nil),
			`/`,
			auth.NewUser(0, `admin`, `admin`),
			``,
			http.StatusNotFound,
		},
		{
			`should list containers from empty path`,
			[]interface{}{[]types.Container{
				{ID: `test`},
			}},
			httptest.NewRequest(http.MethodGet, `/`, nil),
			``,
			auth.NewUser(0, `admin`, `admin`),
			`{"results":[{"Id":"test","Names":null,"Image":"","ImageID":"","Command":"","Created":0,"Ports":null,"Labels":null,"State":"","Status":"","HostConfig":{},"NetworkSettings":null,"Mounts":null}]}`,
			http.StatusOK,
		},
		{
			`should list containers from root path`,
			[]interface{}{[]types.Container{
				{ID: `test`},
			}},
			httptest.NewRequest(http.MethodGet, `/`, nil),
			`/`,
			auth.NewUser(0, `admin`, `admin`),
			`{"results":[{"Id":"test","Names":null,"Image":"","ImageID":"","Command":"","Created":0,"Ports":null,"Labels":null,"State":"","Status":"","HostConfig":{},"NetworkSettings":null,"Mounts":null}]}`,
			http.StatusOK,
		},
		{
			`should inspect container from id path`,
			[]interface{}{types.ContainerJSON{}},
			httptest.NewRequest(http.MethodGet, `/containerID`, nil),
			`/containerID`,
			auth.NewUser(0, `admin`, `admin`),
			`{"Mounts":null,"Config":null,"NetworkSettings":null}`,
			http.StatusOK,
		},
		{
			`should do action on container from id path and action`,
			[]interface{}{types.ContainerJSON{}, types.ContainerJSON{}},
			httptest.NewRequest(http.MethodPost, `/containerID/start`, nil),
			`/containerID/start`,
			auth.NewUser(0, `admin`, `admin`),
			`null`,
			http.StatusOK,
		},
		{
			`should delete container from id path`,
			[]interface{}{types.ContainerJSONBase{ID: `test`, Image: `test`}, types.ContainerJSONBase{}, []types.ImageDeleteResponseItem{}},
			httptest.NewRequest(http.MethodDelete, `/containerID`, nil),
			`/containerID`,
			auth.NewUser(0, `admin`, `admin`),
			`null`,
			http.StatusOK,
		},
		{
			`should handle not expected method`,
			[]interface{}{types.ContainerJSON{}, types.ContainerJSON{}},
			httptest.NewRequest(http.MethodHead, `/containerID`, nil),
			`/containerID`,
			auth.NewUser(0, `admin`, `admin`),
			``,
			http.StatusMethodNotAllowed,
		},
	}

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponses)
		writer := httptest.NewRecorder()
		containersHandler(writer, testCase.response, testCase.urlPath, testCase.user)

		if result := writer.Code; result != testCase.wantStatus {
			t.Errorf("%s\ncontainersHandler(%+v, %+v, %+v) = %+v, want %+v", testCase.intention, testCase.response, testCase.urlPath, testCase.user, result, testCase.wantStatus)
		}

		if result, _ := httputils.ReadBody(writer.Result().Body); string(result) != testCase.want {
			t.Errorf("%s\ncontainersHandler(%+v, %+v, %+v) = %+v, want %+v", testCase.intention, testCase.response, testCase.urlPath, testCase.user, string(result), testCase.want)
		}
	}
}
