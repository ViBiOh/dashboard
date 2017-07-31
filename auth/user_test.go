package auth

import (
	"encoding/base64"
	"fmt"
	"testing"

	"golang.org/x/crypto/bcrypt"
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
			t.Errorf("%v.HasProfile(%v) = %v, want %v", test.profile, test.instance, result, test.want)
		}
	}
}

func TestInit(t *testing.T) {
	var tests = []struct {
		path string
		want int
	}{
		{
			`../test/users_test`,
			2,
		},
	}

	for _, test := range tests {
		Init(test.path)
		if len(users) != test.want {
			t.Errorf("Init(%v) = %v, want %v", test.path, users, test.want)
		}
	}
}

func TestReadConfiguration(t *testing.T) {
	var tests = []struct {
		path string
		want int
	}{
		{
			`notExistingFile`,
			0,
		},
		{
			`../test/users_test`,
			2,
		},
	}

	for _, test := range tests {
		if result := readConfiguration(test.path); len(result) != test.want {
			t.Errorf("readConfiguration(%v) = %v, want %v", test.path, result, test.want)
		}
	}
}

func TestIsAuthenticated(t *testing.T) {
	users = make(map[string]*User)

	password, _ := bcrypt.GenerateFromPassword([]byte(`password`), 12)
	admin := User{`admin`, password, `admin`}
	users[`admin`] = &admin

	guest, _ := bcrypt.GenerateFromPassword([]byte(`guest`), 12)
	users[`guest`] = &User{`guest`, guest, ``}

	var tests = []struct {
		username string
		password string
		want     *User
		wantErr  error
	}{
		{
			`admin`,
			`password`,
			&admin,
			nil,
		},
		{
			`AdMiN`,
			`password`,
			&admin,
			nil,
		},
		{
			`guest`,
			`password`,
			nil,
			fmt.Errorf(`[guest] Invalid credentials`),
		},
		{
			`unknown`,
			`password`,
			nil,
			fmt.Errorf(`[unknown] Invalid credentials`),
		},
	}

	var failed bool

	for _, test := range tests {
		result, err := isAuthenticated(test.username, test.password)

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
			t.Errorf("isAuthenticated(%v, %v) = (%v, %v) want (%v, %v)", test.username, test.password, result, err, test.want, test.wantErr)
		}
	}
}

func TestIsAuthenticatedByAuth(t *testing.T) {
	users = make(map[string]*User)

	password, _ := bcrypt.GenerateFromPassword([]byte(`password`), 12)
	admin := User{`admin`, password, `admin`}
	users[`admin`] = &admin

	var tests = []struct {
		auth    string
		want    *User
		wantErr error
	}{
		{
			`Token 12345`,
			nil,
			fmt.Errorf(`Unable to read authentication type`),
		},
		{
			fmt.Sprintf(`Basic %s`, `admin:password`),
			nil,
			fmt.Errorf(`Unable to read basic authentication`),
		},
		{
			fmt.Sprintf(`Basic %s`, base64.StdEncoding.EncodeToString([]byte(`admin`))),
			nil,
			fmt.Errorf(`Unable to read basic authentication`),
		},
		{
			fmt.Sprintf(`Basic %s`, base64.StdEncoding.EncodeToString([]byte(`admin:password`))),
			&admin,
			nil,
		},
		{
			fmt.Sprintf(`Basic %s`, base64.StdEncoding.EncodeToString([]byte(`admin:guest`))),
			nil,
			fmt.Errorf(`[admin] Invalid credentials`),
		},
	}

	var failed bool

	for _, test := range tests {
		result, err := IsAuthenticatedByAuth(test.auth)

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
			t.Errorf("IsAuthenticatedByAuth(%v) = (%v, %v) want (%v, %v)", test.auth, result, err, test.want, test.wantErr)
		}
	}
}
