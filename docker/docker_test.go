package docker

import (
	"fmt"
	"strings"
	"testing"

	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types/filters"
)

func TestLabelFilters(t *testing.T) {
	var tests = []struct {
		user    *auth.User
		app     string
		want    string
		wantErr error
	}{
		{
			nil,
			``,
			``,
			fmt.Errorf(`Unable to add label filters without user`),
		},
		{
			auth.NewUser(`admin`, `admin`),
			``,
			``,
			nil,
		},
		{
			auth.NewUser(`guest`, `guest`),
			``,
			`owner=guest`,
			nil,
		},
		{
			auth.NewUser(`admin`, `admin`),
			`test`,
			`app=test`,
			nil,
		},
		{
			auth.NewUser(`guest`, `guest`),
			`test`,
			`owner=guest`,
			nil,
		},
	}

	var failed bool

	for _, test := range tests {
		filters := filters.NewArgs()
		err := labelFilters(test.user, &filters, test.app)

		result := strings.Join(filters.Get(`label`), `,`)

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
			t.Errorf(`labelFilters(%v, %v) = (%v, %v), want (%v, %v)`, test.user, test.app, result, err, test.want, test.wantErr)
		}
	}
}

func TestHealthyStatusFilters(t *testing.T) {
	var tests = []struct {
		containers []string
		want       string
	}{
		{
			nil,
			``,
		},
		{
			[]string{`abc123`, `def456`},
			`abc123,def456`,
		},
	}

	for _, test := range tests {
		filters := filters.NewArgs()
		healthyStatusFilters(&filters, test.containers)
		resultEvent := strings.Join(filters.Get(`event`), `,`)
		result := strings.Join(filters.Get(`container`), `,`)

		if resultEvent != `health_status: healthy` || result != test.want {
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
		for _, event := range test.want {
			if !strings.Contains(result, event) {
				failed = true
			}
		}

		if len(rawResult) != len(test.want) || failed {
			t.Errorf(`eventFilters() = %v, want %v`, result, test.want)
		}
	}
}
