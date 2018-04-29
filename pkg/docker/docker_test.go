package docker

import (
	"strings"
	"testing"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/docker/docker/api/types/filters"
)

func Test_LabelFilters(t *testing.T) {
	var cases = []struct {
		user *model.User
		app  string
		want []string
	}{
		{
			model.NewUser(0, `admin`, `admin`),
			``,
			nil,
		},
		{
			model.NewUser(0, `guest`, `guest`),
			``,
			[]string{`owner=guest`},
		},
		{
			model.NewUser(0, `admin`, `admin`),
			`test`,
			[]string{`app=test`},
		},
		{
			model.NewUser(0, `guest`, `guest`),
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

func TestEventFilters(t *testing.T) {
	var cases = []struct {
		want []string
	}{
		{
			[]string{`create`, `start`, `stop`, `restart`, `rename`, `update`, `destroy`, `die`, `kill`},
		},
	}

	var failed bool

	for _, testCase := range cases {
		filters := filters.NewArgs()
		EventFilters(&filters)
		rawResult := filters.Get(`event`)

		failed = false
		result := strings.Join(rawResult, `,`)
		for _, filter := range testCase.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if len(rawResult) != len(testCase.want) || failed {
			t.Errorf(`EventFilters() = %v, want %v`, result, testCase.want)
		}
	}
}
