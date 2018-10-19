package deploy

import (
	"fmt"
	"strings"
	"testing"

	"github.com/docker/docker/api/types/filters"
)

func Test_Flags(t *testing.T) {
	var cases = []struct {
		intention string
		want      string
		wantType  string
	}{
		{
			`should add string network param to flags`,
			`network`,
			`*string`,
		},
		{
			`should add string tag param to flags`,
			`tag`,
			`*string`,
		},
		{
			`should add string containerUser param to flags`,
			`containerUser`,
			`*string`,
		},
		{
			`should add string appURL param to flags`,
			`appURL`,
			`*string`,
		},
		{
			`should add string notification param to flags`,
			`notification`,
			`*string`,
		},
	}

	for _, testCase := range cases {
		result := Flags(testCase.intention)[testCase.want]

		if result == nil {
			t.Errorf("%s\nFlags() = %+v, want `%s`", testCase.intention, result, testCase.want)
		}

		if fmt.Sprintf(`%T`, result) != testCase.wantType {
			t.Errorf("%s\nFlags() = `%T`, want `%s`", testCase.intention, result, testCase.wantType)
		}
	}
}

func TestGetServiceFullName(t *testing.T) {
	var cases = []struct {
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

	for _, testCase := range cases {
		if result := getServiceFullName(testCase.app, testCase.service); result != testCase.want {
			t.Errorf(`getServiceFullName(%+v, %+v) = %+v, want %+v`, testCase.app, testCase.service, result, testCase.want)
		}
	}
}

func TestGetFinalName(t *testing.T) {
	var cases = []struct {
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

	for _, testCase := range cases {
		if result := getFinalName(testCase.serviceFullName); result != testCase.want {
			t.Errorf(`getFinalName(%+v) = %+v, want %+v`, testCase.serviceFullName, result, testCase.want)
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
			[]string{`abc123`, `def456`},
			[]string{`abc123`, `def456`},
		},
	}

	var failed bool

	for _, testCase := range cases {
		filters := filters.NewArgs()
		healthyStatusFilters(&filters, testCase.containers)
		resultEvent := strings.Join(filters.Get(`event`), `,`)
		rawResult := filters.Get(`container`)

		result := strings.Join(rawResult, `,`)
		for _, filter := range testCase.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if resultEvent != `health_status: healthy` || len(rawResult) != len(testCase.want) || failed {
			t.Errorf(`healthyStatusFilters(%v) = %v, want %v`, testCase.containers, result, testCase.want)
		}
	}
}
