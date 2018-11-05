package docker

import (
	"testing"

	"github.com/ViBiOh/auth/pkg/model"
)

func TestIsAdmin(t *testing.T) {
	var cases = []struct {
		user *model.User
		want bool
	}{
		{
			nil,
			false,
		},
		{
			model.NewUser(`0`, `guest`, ``, `guest,multi`),
			false,
		},
		{
			model.NewUser(`0`, `admin`, ``, `admin`),
			true,
		},
	}

	for _, testCase := range cases {
		if result := IsAdmin(testCase.user); result != testCase.want {
			t.Errorf(`IsAdmin(%v) = %v, want %v`, testCase.user, result, testCase.want)
		}
	}
}

func TestIsMultiApp(t *testing.T) {
	var cases = []struct {
		user *model.User
		want bool
	}{
		{
			nil,
			false,
		},
		{
			model.NewUser(`0`, `guest`, ``, `guest,multi`),
			true,
		},
		{
			model.NewUser(`0`, `admin`, ``, `admin`),
			true,
		},
	}

	for _, testCase := range cases {
		if result := isMultiApp(testCase.user); result != testCase.want {
			t.Errorf(`isMultiApp(%v) = %v, want %v`, testCase.user, result, testCase.want)
		}
	}
}
