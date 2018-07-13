package deploy

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/httputils/pkg/request"
	"github.com/docker/docker/api/types/filters"
)

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

func TestComposeFailed(t *testing.T) {
	var cases = []struct {
		user       *model.User
		appName    string
		err        error
		want       string
		wantStatus int
	}{
		{
			model.NewUser(0, `admin`, ``, `admin`),
			`test`,
			errors.New(`test unit error`),
			`[admin] [test] Failed to deploy: test unit error
`,
			http.StatusInternalServerError,
		},
	}

	for _, testCase := range cases {
		writer := httptest.NewRecorder()

		composeFailed(writer, testCase.user, testCase.appName, testCase.err)

		if result := writer.Code; result != testCase.wantStatus {
			t.Errorf(`composeFailed(%+v, %+v, %+v) = %+v, want %+v`, testCase.user, testCase.appName, testCase.err, result, testCase.wantStatus)
		}

		if result, _ := request.ReadBody(writer.Result().Body); string(result) != testCase.want {
			t.Errorf(`composeFailed(%+v, %+v, %+v) = %+v, want %+v`, testCase.user, testCase.appName, testCase.err, string(result), testCase.want)
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
