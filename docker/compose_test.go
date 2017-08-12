package docker

import (
	"reflect"
	"testing"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types/container"
)

func TestGetConfig(t *testing.T) {
	var tests = []struct {
		service *dockerComposeService
		user    *auth.User
		appName string
		want    *container.Config
	}{
		{
			&dockerComposeService{},
			auth.NewUser(`admin`, `admin`),
			`test`,
			&container.Config{
				Labels: map[string]string{`owner`: `admin`, `app`: `test`},
				Env:    []string{},
			},
		},
		{
			&dockerComposeService{
				Image:       `vibioh/dashboard`,
				Environment: map[string]string{`PATH`: `/usr/bin`},
				Labels:      map[string]string{`CUSTOM_LABEL`: `testing`},
				Command:     []string{`entrypoint.sh`, `start`},
			},
			auth.NewUser(`admin`, `admin`),
			`test`,
			&container.Config{
				Image:  `vibioh/dashboard`,
				Labels: map[string]string{`CUSTOM_LABEL`: `testing`, `owner`: `admin`, `app`: `test`},
				Env:    []string{`PATH=/usr/bin`},
				Cmd:    []string{`entrypoint.sh`, `start`},
			},
		},
	}

	for _, test := range tests {
		if result := getConfig(test.service, test.user, test.appName); !reflect.DeepEqual(result, test.want) {
			t.Errorf(`getConfig(%v, %v, %v) = %v, want %v`, test.service, test.user, test.appName, result, test.want)
		}
	}
}

func TestGetServiceFullName(t *testing.T) {
	var tests = []struct {
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

	for _, test := range tests {
		if result := getServiceFullName(test.app, test.service); result != test.want {
			t.Errorf(`getServiceFullName(%v, %v) = %v, want %v`, test.app, test.service, result, test.want)
		}
	}
}

func TestGetFinalName(t *testing.T) {
	var tests = []struct {
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

	for _, test := range tests {
		if result := getFinalName(test.serviceFullName); result != test.want {
			t.Errorf(`getFinalName(%v) = %v, want %v`, test.serviceFullName, result, test.want)
		}
	}
}
