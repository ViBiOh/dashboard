package auth

import (
	"testing"
)

func TestHasProfile(t *testing.T) {
	var tests = []struct {
		instance *User
		profile  string
		want     bool
	}{
		{
			&User{},
			`admin`,
			false,
		},
		{
			&User{profiles: `admin,multi`},
			`admin`,
			true,
		},
	}

	for _, test := range tests {
		if result := test.instance.HasProfile(test.profile); result != test.want {
			t.Errorf("HasProfile(%v) with %v = %v, want %v", test.profile, test.instance, result, test.want)
		}
	}
}
