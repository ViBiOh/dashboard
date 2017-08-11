package docker

import (
	"testing"
)

func TestCanBeGracefullyClosed(t *testing.T) {
	var tests = []struct {
		backgroundTasks map[string]bool
		want            bool
	}{
		{
			map[string]bool{`dashboard`: false},
			true,
		},
		{
			map[string]bool{`dashboard`: false, `test`: true},
			false,
		},
	}

	for _, test := range tests {
		backgroundTasks = test.backgroundTasks

		if result := CanBeGracefullyClosed(); result != test.want {
			t.Errorf(`CanBeGracefullyClosed() = %v, want %v, for %v`, result, test.want, test.backgroundTasks)
		}
	}
}
