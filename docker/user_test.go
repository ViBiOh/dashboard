package docker

import (
	"testing"

	"github.com/ViBiOh/dashboard/auth"
)

func TestIsAdmin(t *testing.T) {
	var cases = []struct {
		user *auth.User
		want bool
	}{
		{
			nil,
			false,
		},
		{
			auth.NewUser(`guest`, `guest,multi`),
			false,
		},
		{
			auth.NewUser(`admin`, `admin`),
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
		user *auth.User
		want bool
	}{
		{
			nil,
			false,
		},
		{
			auth.NewUser(`guest`, `guest,multi`),
			true,
		},
		{
			auth.NewUser(`admin`, `admin`),
			true,
		},
	}

	for _, testCase := range cases {
		if result := isMultiApp(testCase.user); result != testCase.want {
			t.Errorf(`isMultiApp(%v) = %v, want %v`, testCase.user, result, testCase.want)
		}
	}
}
