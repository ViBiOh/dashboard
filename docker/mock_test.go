package docker

import (
	"bytes"
	"encoding/json"
	"errors"
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

func mockClient(t *testing.T, messages []interface{}) *client.Client {
	var message interface{}
	current := 0

	docker, err := client.NewClient(`http://localhost`, ``, &http.Client{
		Transport: mockTransport(func(*http.Request) (*http.Response, error) {
			if current < len(messages) {
				message = messages[current]
			} else {
				message = nil
			}
			current++

			if message == nil {
				return nil, errors.New(`internal server error`)
			}
			return marshalContent(t, message)
		}),
	}, nil)

	if err != nil {
		t.Errorf(`Error while creating mock client: %v`, err)
	}

	return docker
}
