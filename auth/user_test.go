package auth

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHasProfile(t *testing.T) {
	var tests = []struct {
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

	for _, test := range tests {
		if result := test.instance.HasProfile(test.profile); result != test.want {
			t.Errorf(`%v.HasProfile(%v) = %v, want %v`, test.profile, test.instance, result, test.want)
		}
	}
}

func TestInit(t *testing.T) {
	var tests = []struct {
		usersProfiles string
		want          int
	}{
		{
			`admin:admin,multi|guest:guest`,
			2,
		},
	}

	for _, test := range tests {
		usersProfiles = &test.usersProfiles
		Init()

		if result := len(users); result != test.want {
			t.Errorf(`Init() = %v, want %v, with usersProfiles = %v`, result, test.want, test.usersProfiles)
		}
	}
}

func TestLoadUsersProfiles(t *testing.T) {
	var tests = []struct {
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

	for _, test := range tests {
		loadUsersProfiles(test.usersAndProfiles)

		if result := len(users); result != test.want {
			t.Errorf(`loadUsersProfiles(%v) = %v, want %v`, test.usersAndProfiles, result, test.want)
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
	admin := User{`admin`, `admin`}
	users = map[string]*User{`admin`: &admin}

	var tests = []struct {
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
			&admin,
			nil,
		},
	}

	var failed bool

	for _, test := range tests {
		result, err := IsAuthenticatedByAuth(test.authorization)

		failed = false

		if err == nil && test.wantErr != nil {
			failed = true
		} else if err != nil && test.wantErr == nil {
			failed = true
		} else if err != nil && err.Error() != test.wantErr.Error() {
			failed = true
		} else if result != test.want {
			failed = true
		}

		if failed {
			t.Errorf(`IsAuthenticatedByAuth(%v) = (%v, %v), want (%v, %v)`, test.authorization, result, err, test.want, test.wantErr)
		}
	}
}
