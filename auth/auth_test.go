package auth

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHasProfile(t *testing.T) {
	var cases = []struct {
		instance User
		profile  string
		want     bool
	}{
		{
			User{},
			`admin`,
			false,
		},
		{
			User{profiles: `admin`},
			`admin`,
			true,
		},
		{
			User{profiles: `admin,multi`},
			`multi`,
			true,
		},
		{
			User{profiles: `multi`},
			`admin`,
			false,
		},
	}

	for _, testCase := range cases {
		if result := testCase.instance.HasProfile(testCase.profile); result != testCase.want {
			t.Errorf(`%v.HasProfile(%v) = %v, want %v`, testCase.profile, testCase.instance, result, testCase.want)
		}
	}
}

func TestInit(t *testing.T) {
	var cases = []struct {
		usersProfiles string
		want          int
	}{
		{
			`admin:admin,multi|guest:guest`,
			2,
		},
	}

	for _, testCase := range cases {
		usersProfiles = &testCase.usersProfiles
		Init()

		if result := len(users); result != testCase.want {
			t.Errorf(`Init() = %v, want %v, with usersProfiles = %v`, result, testCase.want, testCase.usersProfiles)
		}
	}
}

func TestLoadUsersProfiles(t *testing.T) {
	var cases = []struct {
		usersAndProfiles string
		want             int
	}{
		{
			``,
			0,
		},
		{
			`admin:admin`,
			1,
		},
		{
			`admin:admin,multi|guest:|visitor:visitor`,
			3,
		},
	}

	for _, testCase := range cases {
		LoadUsersProfiles(testCase.usersAndProfiles)

		if result := len(users); result != testCase.want {
			t.Errorf(`LoadUsersProfiles(%v) = %v, want %v`, testCase.usersAndProfiles, result, testCase.want)
		}
	}
}

func TestIsAuthenticatedByAuth(t *testing.T) {
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get(`Authorization`) == `unauthorized` {
			w.WriteHeader(http.StatusUnauthorized)
		} else {
			w.Write([]byte(r.Header.Get(`Authorization`)))
		}
	}))
	defer testServer.Close()

	authURL = &testServer.URL
	admin := NewUser(`admin`, `admin`)
	users = map[string]*User{`admin`: admin}

	var cases = []struct {
		authorization string
		want          *User
		wantErr       error
	}{
		{
			`unauthorized`,
			nil,
			fmt.Errorf(`Error while getting username: Error status 401: `),
		},
		{
			`guest`,
			nil,
			fmt.Errorf(`[guest] Not allowed to use app`),
		},
		{
			`admin`,
			admin,
			nil,
		},
	}

	var failed bool

	for _, testCase := range cases {
		result, err := IsAuthenticatedByAuth(testCase.authorization, `127.0.0.1`)

		failed = false

		if err == nil && testCase.wantErr != nil {
			failed = true
		} else if err != nil && testCase.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != testCase.wantErr.Error() {
			failed = true
		} else if result != testCase.want {
			failed = true
		}

		if failed {
			t.Errorf(`IsAuthenticatedByAuth(%v) = (%v, %v), want (%v, %v)`, testCase.authorization, result, err, testCase.want, testCase.wantErr)
		}
	}
}
