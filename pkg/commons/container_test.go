package commons

import (
	"strings"
	"testing"

	"github.com/docker/docker/api/types/filters"
)

func Test_EventFilters(t *testing.T) {
	var cases = []struct {
		intention string
		want      []string
	}{
		{
			`should add all events`,
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

		if failed || len(rawResult) != len(testCase.want) {
			t.Errorf("%s\nEventFilters() = %+v, want %+v", testCase.intention, result, testCase.want)
		}
	}
}
