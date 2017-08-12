package docker

import (
	"strings"
	"testing"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types/filters"
)

func TestLabelFilters(t *testing.T) {
	var tests = []struct {
		user *auth.User
		app  string
		want []string
	}{
		{
			auth.NewUser(`admin`, `admin`),
			``,
			nil,
		},
		{
			auth.NewUser(`guest`, `guest`),
			``,
			[]string{`owner=guest`},
		},
		{
			auth.NewUser(`admin`, `admin`),
			`test`,
			[]string{`app=test`},
		},
		{
			auth.NewUser(`guest`, `guest`),
			`test`,
			[]string{`owner=guest`},
		},
	}

	var failed bool

	for _, test := range tests {
		filters := filters.NewArgs()
		labelFilters(test.user, &filters, test.app)
		rawResult := filters.Get(`label`)

		failed = false
		result := strings.Join(rawResult, `,`)
		for _, filter := range test.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if len(rawResult) != len(test.want) || failed {
			t.Errorf(`labelFilters(%v, %v) = %v, want %v`, test.user, test.app, result, test.want)
		}
	}
}

func TestHealthyStatusFilters(t *testing.T) {
	var tests = []struct {
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

	for _, test := range tests {
		filters := filters.NewArgs()
		healthyStatusFilters(&filters, test.containers)
		resultEvent := strings.Join(filters.Get(`event`), `,`)
		rawResult := filters.Get(`container`)

		result := strings.Join(rawResult, `,`)
		for _, filter := range test.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if resultEvent != `health_status: healthy` || len(rawResult) != len(test.want) || failed {
			t.Errorf(`healthyStatusFilters(%v) = %v, want %v`, test.containers, result, test.want)
		}
	}
}

func TestEventFilters(t *testing.T) {
	var tests = []struct {
		want []string
	}{
		{
			[]string{`create`, `start`, `stop`, `restart`, `rename`, `update`, `destroy`, `die`, `kill`},
		},
	}

	var failed bool

	for _, test := range tests {
		filters := filters.NewArgs()
		eventFilters(&filters)
		rawResult := filters.Get(`event`)

		failed = false
		result := strings.Join(rawResult, `,`)
		for _, filter := range test.want {
			if !strings.Contains(result, filter) {
				failed = true
			}
		}

		if len(rawResult) != len(test.want) || failed {
			t.Errorf(`eventFilters() = %v, want %v`, result, test.want)
		}
	}
}
