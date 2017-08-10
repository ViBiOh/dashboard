package docker

import (
	"testing"
)

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
