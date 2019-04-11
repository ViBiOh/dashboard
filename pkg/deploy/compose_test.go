package deploy

import (
	"strings"
	"testing"

	"github.com/docker/docker/api/types/filters"
)

func TestGetServiceFullName(t *testing.T) {
	var cases = []struct {
		app     string
		service string
		want    string
	}{
		{
			"dashboard",
			"api",
			"dashboard_api_deploy",
		},
	}

	for _, testCase := range cases {
		if result := getServiceFullName(testCase.app, testCase.service); result != testCase.want {
			t.Errorf("getServiceFullName(%+v, %+v) = %+v, want %+v", testCase.app, testCase.service, result, testCase.want)
		}
	}
}

func TestGetFinalName(t *testing.T) {
	var cases = []struct {
		serviceFullName string
		want            string
	}{
		{
			"dashboard_deploy",
			"dashboard",
		},
		{
			"dashboard",
			"dashboard",
		},
	}

	for _, testCase := range cases {
		if result := getFinalName(testCase.serviceFullName); result != testCase.want {
			t.Errorf("getFinalName(%+v) = %+v, want %+v", testCase.serviceFullName, result, testCase.want)
		}
	}
}

func TestHealthyStatusFilters(t *testing.T) {
	var cases = []struct {
		containers []string
		want       []string
	}{
		{
			nil,
			nil,
		},
		{
			[]string{"abc123", "def456"},
			[]string{"abc123", "def456"},
		},
	}

	var failed bool

	for _, testCase := range cases {
		filters := filters.NewArgs()
		healthyStatusFilters(&filters, testCase.containers)
		resultEvent := strings.Join(filters.Get("event"), ",")
		rawResult := filters.Get("container")

		result := strings.Join(rawResult, ",")
		for _, filter := range testCase.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if resultEvent != "health_status: healthy" || len(rawResult) != len(testCase.want) || failed {
			t.Errorf("healthyStatusFilters(%v) = %v, want %v", testCase.containers, result, testCase.want)
		}
	}
}
