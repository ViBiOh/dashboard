package docker

import (
	"testing"

	authProvider "github.com/ViBiOh/auth/provider"
)

func TestIsAdmin(t *testing.T) {
	var cases = []struct {
		user *authProvider.User
		want bool
	}{
		{
			nil,
			false,
		},
		{
			authProvider.NewUser(0, `guest`, `guest,multi`),
			false,
		},
		{
			authProvider.NewUser(0, `admin`, `admin`),
			true,
		},
	}

	for _, testCase := range cases {
		if result := isAdmin(testCase.user); result != testCase.want {
			t.Errorf(`isAdmin(%v) = %v, want %v`, testCase.user, result, testCase.want)
		}
	}
}

func TestIsMultiApp(t *testing.T) {
	var cases = []struct {
		user *authProvider.User
		want bool
	}{
		{
			nil,
			false,
		},
		{
			authProvider.NewUser(0, `guest`, `guest,multi`),
			true,
		},
		{
			authProvider.NewUser(0, `admin`, `admin`),
			true,
		},
	}

	for _, testCase := range cases {
		if result := isMultiApp(testCase.user); result != testCase.want {
			t.Errorf(`isMultiApp(%v) = %v, want %v`, testCase.user, result, testCase.want)
		}
	}
}
