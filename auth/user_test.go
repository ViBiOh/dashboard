package auth

import (
	"encoding/base64"
	"fmt"
	"golang.org/x/crypto/bcrypt"
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
			&User{profiles: `admin`},
			`admin`,
			true,
		},
		{
			&User{profiles: `admin,multi`},
			`multi`,
			true,
		},
		{
			&User{profiles: `multi`},
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

func TestIsAuthenticated(t *testing.T) {
	users = make(map[string]*User)

	password, _ := bcrypt.GenerateFromPassword([]byte(`password`), 12)
	users[`admin`] = &User{`admin`, password, `admin`}

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
			users[`admin`],
			nil,
		},
		{
			`AdMiN`,
			`password`,
			users[`admin`],
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

	for _, test := range tests {
		result, err := isAuthenticated(test.username, test.password)
		if result != test.want || (err == nil && test.wantErr != nil) || (err != nil && test.wantErr == nil) || (err != nil && test.wantErr != nil && err.Error() != test.wantErr.Error()) {
			t.Errorf("isAuthenticated(%v, %v) = (%v, %v) want (%v, %v)", test.username, test.password, result, err, test.want, test.wantErr)
		}
	}
}

func TestIsAuthenticatedByAuth(t *testing.T) {
	users = make(map[string]*User)

	password, _ := bcrypt.GenerateFromPassword([]byte(`password`), 12)
	users[`admin`] = &User{`admin`, password, `admin`}

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
			users[`admin`],
			nil,
		},
		{
			fmt.Sprintf(`Basic %s`, base64.StdEncoding.EncodeToString([]byte(`admin:guest`))),
			nil,
			fmt.Errorf(`[admin] Invalid credentials`),
		},
	}

	for _, test := range tests {
		result, err := IsAuthenticatedByAuth(test.auth)
		if result != test.want || (err == nil && test.wantErr != nil) || (err != nil && test.wantErr == nil) || (err != nil && test.wantErr != nil && err.Error() != test.wantErr.Error()) {
			t.Errorf("IsAuthenticatedByAuth(%v) = (%v, %v) want (%v, %v)", test.auth, result, err, test.want, test.wantErr)
		}
	}
}
