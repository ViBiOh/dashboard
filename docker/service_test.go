package docker

import (
	"errors"
	"reflect"
	"testing"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types/swarm"
)

func TestListServices(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		user           *auth.User
		appName        string
		want           []swarm.Service
		wantErr        error
	}{
		{
			[]swarm.Service{{ID: `test`}},
			auth.NewUser(`test`, `test`),
			`test`,
			[]swarm.Service{{ID: `test`}},
			nil,
		},
		{
			nil,
			auth.NewUser(`test`, `test`),
			`test`,
			nil,
			errors.New(`error during connect: Get http://localhost/services?filters=%7B%22label%22%3A%7B%22owner%3Dtest%22%3Atrue%7D%7D: internal server error`),
		},
	}

	var failed bool

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponse)
		result, err := listServices(testCase.user, testCase.appName)

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
			t.Errorf(`listServices(%v,  %v) = (%v, %v), want (%v, %v)`, testCase.user, testCase.appName, result, err, testCase.want, testCase.wantErr)
		}
	}
}
