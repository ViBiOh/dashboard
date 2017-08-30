package docker

import (
	"net/http"
	"net/http/httptest"
	"testing"

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
		backgroundTasks = testCase.backgroundTasks

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
