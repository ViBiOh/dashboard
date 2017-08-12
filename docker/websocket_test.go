package docker

import (
	"testing"
)

func TestInitWebsocket(t *testing.T) {
	InitWebsocket()

	if hostCheck == nil {
		t.Errorf(`InitWebsocket() = %v, want not nil`, hostCheck)
	}
}
