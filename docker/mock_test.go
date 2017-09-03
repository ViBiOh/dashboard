package docker

import (
	"bytes"
	"io/ioutil"
	"net/http"
	"testing"

	"github.com/docker/docker/client"
)

type mockTransport func(*http.Request) (*http.Response, error)

func (t mockTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	return t(req)
}

func mockClient(t *testing.T, status int, message string) *client.Client {
	docker, err := client.NewClient(`http://localhost`, `test`, &http.Client{
		Transport: mockTransport(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: status,
				Body:       ioutil.NopCloser(bytes.NewReader([]byte(message))),
			}, nil
		}),
	}, nil)

	if err != nil {
		t.Errorf(`Error while creating mock client: %v`, err)
	}
	return docker
}
