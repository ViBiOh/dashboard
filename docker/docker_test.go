package docker

import (
	"strings"
	"testing"

	"github.com/ViBiOh/auth/auth"
	"github.com/docker/docker/api/types/filters"
)

func TestLabelFilters(t *testing.T) {
	var cases = []struct {
		user *auth.User
		app  string
		want []string
	}{
		{
			auth.NewUser(0, `admin`, `admin`),
			``,
			nil,
		},
		{
			auth.NewUser(0, `guest`, `guest`),
			``,
			[]string{`owner=guest`},
		},
		{
			auth.NewUser(0, `admin`, `admin`),
			`test`,
			[]string{`app=test`},
		},
		{
			auth.NewUser(0, `guest`, `guest`),
			`test`,
			[]string{`owner=guest`},
		},
	}

	var failed bool

	for _, testCase := range cases {
		filters := filters.NewArgs()
		labelFilters(testCase.user, &filters, testCase.app)
		rawResult := filters.Get(`label`)

		failed = false
		result := strings.Join(rawResult, `,`)
		for _, filter := range testCase.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if len(rawResult) != len(testCase.want) || failed {
			t.Errorf(`labelFilters(%v, %v) = %v, want %v`, testCase.user, testCase.app, result, testCase.want)
		}
	}
}

func TestHealthyStatusFilters(t *testing.T) {
	var cases = []struct {
		containers []string
		want       []string
	}{
		{
			nil,
			nil,
		},
		{
			[]string{`abc123`, `def456`},
			[]string{`abc123`, `def456`},
		},
	}

	var failed bool

	for _, testCase := range cases {
		filters := filters.NewArgs()
		healthyStatusFilters(&filters, testCase.containers)
		resultEvent := strings.Join(filters.Get(`event`), `,`)
		rawResult := filters.Get(`container`)

		result := strings.Join(rawResult, `,`)
		for _, filter := range testCase.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if resultEvent != `health_status: healthy` || len(rawResult) != len(testCase.want) || failed {
			t.Errorf(`healthyStatusFilters(%v) = %v, want %v`, testCase.containers, result, testCase.want)
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
		eventFilters(&filters)
		rawResult := filters.Get(`event`)

		failed = false
		result := strings.Join(rawResult, `,`)
		for _, filter := range testCase.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if len(rawResult) != len(testCase.want) || failed {
			t.Errorf(`eventFilters() = %v, want %v`, result, testCase.want)
		}
	}
}
