package docker

import (
	"testing"

	"github.com/ViBiOh/dashboard/auth"
)

func TestIsAdmin(t *testing.T) {
	var tests = []struct {
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

	for _, test := range tests {
		if result := isAdmin(test.user); result != test.want {
			t.Errorf(`isAdmin(%v) = %v, want %v`, test.user, result, test.want)
		}
	}
}

func TestIsMultiApp(t *testing.T) {
	var tests = []struct {
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

	for _, test := range tests {
		if result := isMultiApp(test.user); result != test.want {
			t.Errorf(`isMultiApp(%v) = %v, want %v`, test.user, result, test.want)
		}
	}
}
