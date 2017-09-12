package docker

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/ViBiOh/httputils"
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

func TestListServicesHandler(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		user           *auth.User
		want           string
		wantStatus     int
	}{
		{
			nil,
			nil,
			`A user is required
`,
			http.StatusBadRequest,
		},
		{
			nil,
			auth.NewUser(`admin`, `admin`),
			`error during connect: Get http://localhost/services: internal server error
`,
			http.StatusInternalServerError,
		},
		{
			[]swarm.Service{{ID: `test`}},
			auth.NewUser(`admin`, `admin`),
			`{"results":[{"ID":"test","Version":{},"CreatedAt":"0001-01-01T00:00:00Z","UpdatedAt":"0001-01-01T00:00:00Z","Spec":{"Labels":null,"TaskTemplate":{"ForceUpdate":0},"Mode":{}},"Endpoint":{"Spec":{}}}]}`,
			http.StatusOK,
		},
	}

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponse)
		writer := httptest.NewRecorder()
		listServicesHandler(writer, testCase.user)

		if result := writer.Code; result != testCase.wantStatus {
			t.Errorf(`listServicesHandler(%v) = %v, want %v`, testCase.user, result, testCase.wantStatus)
		}

		if result, _ := httputils.ReadBody(writer.Result().Body); string(result) != testCase.want {
			t.Errorf(`listServicesHandler(%v) = %v, want %v`, testCase.user, string(result), testCase.want)
		}
	}
}

func TestServicesHandler(t *testing.T) {
	var cases = []struct {
		dockerResponse interface{}
		r              *http.Request
		urlPath        string
		user           *auth.User
		want           string
		wantStatus     int
	}{
		{
			nil,
			httptest.NewRequest(http.MethodHead, `/`, nil),
			``,
			nil,
			``,
			http.StatusNotFound,
		},
		{
			[]swarm.Service{{ID: `test`}},
			httptest.NewRequest(http.MethodGet, `/`, nil),
			`/`,
			auth.NewUser(`admin`, `admin`),
			`{"results":[{"ID":"test","Version":{},"CreatedAt":"0001-01-01T00:00:00Z","UpdatedAt":"0001-01-01T00:00:00Z","Spec":{"Labels":null,"TaskTemplate":{"ForceUpdate":0},"Mode":{}},"Endpoint":{"Spec":{}}}]}`,
			http.StatusOK,
		},
	}

	for _, testCase := range cases {
		docker = mockClient(t, testCase.dockerResponse)
		writer := httptest.NewRecorder()

		servicesHandler(writer, testCase.r, testCase.urlPath, testCase.user)

		if result := writer.Code; result != testCase.wantStatus {
			t.Errorf(`servicesHandler(%v, %v, %v) = %v, want %v`, testCase.r, testCase.urlPath, testCase.user, result, testCase.wantStatus)
		}

		if result, _ := httputils.ReadBody(writer.Result().Body); string(result) != testCase.want {
			t.Errorf(`servicesHandler(%v, %v, %v) = %v, want %v`, testCase.r, testCase.urlPath, testCase.user, string(result), testCase.want)
		}
	}
}
