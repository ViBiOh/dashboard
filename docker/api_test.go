package docker

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/docker/docker/client"
)

func TestCanBeGracefullyClosed(t *testing.T) {
	var tests = []struct {
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

	for _, test := range tests {
		backgroundTasks = test.backgroundTasks

		if result := CanBeGracefullyClosed(); result != test.want {
			t.Errorf(`CanBeGracefullyClosed() = %v, want %v, for %v`, result, test.want, test.backgroundTasks)
		}
	}
}

func TestHealthHandler(t *testing.T) {
	testDocker, _ := client.NewEnvClient()

	var tests = []struct {
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

	for _, test := range tests {
		docker = test.docker
		w := httptest.NewRecorder()
		healthHandler(w, nil)

		if result := w.Result().StatusCode; result != test.want {
			t.Errorf(`healthHandler() = %v, want %v, with docker=%v`, result, test.want, test.docker)
		}
	}
}
