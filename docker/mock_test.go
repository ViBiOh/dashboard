package docker

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"testing"

	"github.com/docker/docker/client"
)

type mockTransport func(*http.Request) (*http.Response, error)

func (t mockTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	return t(req)
}

func marshalContent(t *testing.T, message interface{}) (*http.Response, error) {
	objJSON, err := json.Marshal(message)
	if err != nil {
		t.Errorf(`Error while marshalling mocked content for docker client: %v`, err)
		return nil, err
	}

	return &http.Response{
		StatusCode: http.StatusOK,
		Body:       ioutil.NopCloser(bytes.NewReader(objJSON)),
	}, nil
}

func mockClient(t *testing.T, message interface{}) *client.Client {
	docker, err := client.NewClient(`http://localhost`, `test`, &http.Client{
		Transport: mockTransport(func(*http.Request) (*http.Response, error) {
			if message == nil {
				return &http.Response{
					StatusCode: http.StatusInternalServerError,
					Body:       ioutil.NopCloser(bytes.NewReader([]byte(`internal server error`))),
				}, nil
			}
			return marshalContent(t, message)
		}),
	}, nil)

	if err != nil {
		t.Errorf(`Error while creating mock client: %v`, err)
	}
	return docker
}

func mockClientHandler(t *testing.T, action func(*http.Request) (*http.Response, error)) *client.Client {
	docker, err := client.NewClient(`http://localhost`, `test`, &http.Client{
		Transport: mockTransport(action),
	}, nil)

	if err != nil {
		t.Errorf(`Error while creating mock client: %v`, err)
	}
	return docker
}
