package docker

import (
	"testing"
)

func TestGetFinalName(t *testing.T) {
	var tests = []struct {
		serviceFullName string
		want            string
	}{
		{
			`dashboard_deploy`,
			`dashboard`,
		},
		{
			`dashboard`,
			`dashboard`,
		},
	}

	for _, test := range tests {
		if result := getFinalName(test.serviceFullName); result != test.want {
			t.Errorf("getFinalName(%v) = %v, want %v", test.serviceFullName, result, test.want)
		}
	}
}
