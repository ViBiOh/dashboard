package auth

import (
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
