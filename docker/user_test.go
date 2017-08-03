package docker

import (
	"encoding/base64"
	"fmt"
	"github.com/ViBiOh/dashboard/auth"
	"testing"
)

func TestIsAdmin(t *testing.T) {
	var tests = []struct {
		credentials string
		want        bool
	}{
		{
			fmt.Sprintf(`Basic %s`, base64.StdEncoding.EncodeToString([]byte(`anonymous:anonymous`))),
			false,
		},
		{
			fmt.Sprintf(`Basic %s`, base64.StdEncoding.EncodeToString([]byte(`guest:guest`))),
			false,
		},
		{
			fmt.Sprintf(`Basic %s`, base64.StdEncoding.EncodeToString([]byte(`admin:password`))),
			true,
		},
	}

	auth.Init(`users_test`)

	for _, test := range tests {
		user, _ := auth.IsAuthenticatedByAuth(test.credentials)

		if result := isAdmin(user); result != test.want {
			t.Errorf("isAdmin(%v) = %v, want %v", user, result, test.want)
		}
	}
}
