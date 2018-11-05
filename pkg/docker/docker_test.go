package docker

import (
	"fmt"
	"strings"
	"testing"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/docker/docker/api/types/filters"
)

func Test_Flags(t *testing.T) {
	var cases = []struct {
		intention string
		want      string
		wantType  string
	}{
		{
			`should add string host param to flags`,
			`host`,
			`*string`,
		},
		{
			`should add string version param to flags`,
			`version`,
			`*string`,
		},
	}

	for _, testCase := range cases {
		result := Flags(testCase.intention)[testCase.want]

		if result == nil {
			t.Errorf("%s\nFlags() = %+v, want `%s`", testCase.intention, result, testCase.want)
		}

		if fmt.Sprintf(`%T`, result) != testCase.wantType {
			t.Errorf("%s\nFlags() = `%T`, want `%s`", testCase.intention, result, testCase.wantType)
		}
	}
}

func Test_LabelFilters(t *testing.T) {
	var cases = []struct {
		user *model.User
		app  string
		want []string
	}{
		{
			model.NewUser(`0`, `admin`, ``, `admin`),
			``,
			nil,
		},
		{
			model.NewUser(`0`, `guest`, ``, `guest`),
			``,
			[]string{`owner=guest`},
		},
		{
			model.NewUser(`0`, `admin`, ``, `admin`),
			`test`,
			[]string{`app=test`},
		},
		{
			model.NewUser(`0`, `guest`, ``, `guest`),
			`test`,
			[]string{`owner=guest`},
		},
	}

	var failed bool

	for _, testCase := range cases {
		filters := filters.NewArgs()
		LabelFilters(testCase.user, &filters, testCase.app)
		rawResult := filters.Get(`label`)

		failed = false
		result := strings.Join(rawResult, `,`)
		for _, filter := range testCase.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if len(rawResult) != len(testCase.want) || failed {
			t.Errorf(`LabelFilters(%v, %v) = %v, want %v`, testCase.user, testCase.app, result, testCase.want)
		}
	}
}
