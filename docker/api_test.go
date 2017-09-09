package docker

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/httputils"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
)

func TestCanBeGracefullyClosed(t *testing.T) {
	var cases = []struct {
		backgroundTasks map[string]bool
		want            bool
	}{
		{
			map[string]bool{`dashboard`: false},
			true,
		},
		{
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
			t.Errorf(`CanBeGracefullyClosed() = %v, want %v, for %v`, result, testCase.want, testCase.backgroundTasks)
		}
	}
}

func TestHealthHandler(t *testing.T) {
	testDocker, _ := client.NewEnvClient()

	var cases = []struct {
		docker *client.Client
		want   int
	}{
		{
			nil,
			http.StatusServiceUnavailable,
		},
		{
			testDocker,
			http.StatusOK,
		},
	}

	for _, testCase := range cases {
		docker = testCase.docker
		w := httptest.NewRecorder()
		healthHandler(w, nil)

		if result := w.Result().StatusCode; result != testCase.want {
			t.Errorf(`healthHandler() = %v, want %v, with docker=%v`, result, testCase.want, testCase.docker)
		}
	}
}

func TestInfoHandler(t *testing.T) {
	var cases = []struct {
		message interface{}
		want    int
	}{
		{
			nil,
			500,
		},
		{
			&types.Info{ID: "test ID", Containers: 3},
			200,
		},
	}

	for _, testCase := range cases {
		docker = mockClient(t, testCase.message)

		w := httptest.NewRecorder()
		infoHandler(w)

		if result := w.Result().StatusCode; result != testCase.want {
			t.Errorf(`infoHandler() = %v, want %v, with docker=%v`, result, testCase.want, testCase.message)
		}
	}
}

func TestContainersHandler(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		response       *http.Request
		urlPath        string
		user           *auth.User
		want           string
		wantStatus     int
	}{
		{
			nil,
			httptest.NewRequest(http.MethodHead, `/`, nil),
			`/`,
			auth.NewUser(`admin`, `admin`),
			``,
			http.StatusMethodNotAllowed,
		},
		{
			[]types.Container{
				{ID: `test`},
			},
			httptest.NewRequest(http.MethodGet, `/`, nil),
			``,
			auth.NewUser(`admin`, `admin`),
			`{"results":[{"Id":"test","Names":null,"Image":"","ImageID":"","Command":"","Created":0,"Ports":null,"Labels":null,"State":"","Status":"","HostConfig":{},"NetworkSettings":null,"Mounts":null}]}`,
			http.StatusOK,
		},
		{
			[]types.Container{
				{ID: `test`},
			},
			httptest.NewRequest(http.MethodGet, `/`, nil),
			`/`,
			auth.NewUser(`admin`, `admin`),
			`{"results":[{"Id":"test","Names":null,"Image":"","ImageID":"","Command":"","Created":0,"Ports":null,"Labels":null,"State":"","Status":"","HostConfig":{},"NetworkSettings":null,"Mounts":null}]}`,
			http.StatusOK,
		},
		{
			types.ContainerJSON{},
			httptest.NewRequest(http.MethodGet, `/`, nil),
			`/containerID`,
			auth.NewUser(`admin`, `admin`),
			`{"Mounts":null,"Config":null,"NetworkSettings":null}`,
			http.StatusOK,
		},
		{
			types.ContainerJSON{},
			httptest.NewRequest(http.MethodPost, `/`, nil),
			`/containerID/start`,
			auth.NewUser(`admin`, `admin`),
			``,
			http.StatusOK,
		},
	}

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponse)
		writer := httptest.NewRecorder()
		containersHandler(writer, testCase.response, testCase.urlPath, testCase.user)

		if writer.Code != testCase.wantStatus {
			t.Errorf(`containersHandler(%v, %v, %v) = %v, want %v`, testCase.response, testCase.urlPath, testCase.user, writer.Code, testCase.wantStatus)
		}

		if result, _ := httputils.ReadBody(writer.Result().Body); string(result) != testCase.want {
			t.Errorf(`containersHandler(%v, %v, %v) = %v, want %v`, testCase.response, testCase.urlPath, testCase.user, string(result), testCase.want)
		}
	}
}
