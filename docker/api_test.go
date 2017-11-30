package docker

import (
	"sync"
	"testing"
)

func Test_CanBeGracefullyClosed(t *testing.T) {
	var cases = []struct {
		intention       string
		backgroundTasks map[string]bool
		want            bool
	}{
		{
			`should allow graceful if no current deployment`,
			map[string]bool{`dashboard`: false},
			true,
		},
		{
			`should disallow if deployment running`,
			map[string]bool{`dashboard`: false, `test`: true},
			false,
		},
	}

	for _, testCase := range cases {
		backgroundTasks = sync.Map{}
		for key, value := range testCase.backgroundTasks {
			backgroundTasks.Store(key, value)
		}

		if result := CanBeGracefullyClosed(); result != testCase.want {
			t.Errorf("%s\nCanBeGracefullyClosed() = %+v, want %+v, with %+v", testCase.intention, result, testCase.want, testCase.backgroundTasks)
		}
	}
}
