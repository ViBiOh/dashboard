package docker

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/docker/docker/api/types"
)

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
