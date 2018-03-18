package docker

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	authProvider "github.com/ViBiOh/auth/provider"
	"github.com/ViBiOh/httputils/request"
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
		user       *authProvider.User
		appName    string
		err        error
		want       string
		wantStatus int
	}{
		{
			authProvider.NewUser(0, `admin`, `admin`),
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
