package docker

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestBadRequest(t *testing.T) {
	var tests = []struct {
		err  error
		want string
	}{
		{
			fmt.Errorf(`BadRequest`),
			`BadRequest
`,
		},
	}

	for _, test := range tests {
		writer := httptest.NewRecorder()
		badRequest(writer, test.err)

		if result := writer.Result().StatusCode; result != http.StatusBadRequest {
			t.Errorf(`badRequest(%v) = %v, want %v`, test.err, result, http.StatusBadRequest)
		}

		if result, _ := readBody(writer.Result().Body); string(result) != string(test.want) {
			t.Errorf(`badRequest(%v) = %v, want %v`, test.err, string(result), string(test.want))
		}
	}
}

func TestUnauthorized(t *testing.T) {
	var tests = []struct {
		err  error
		want string
	}{
		{
			fmt.Errorf(`Unauthorized`),
			`Unauthorized
`,
		},
	}

	for _, test := range tests {
		writer := httptest.NewRecorder()
		unauthorized(writer, test.err)

		if result := writer.Result().StatusCode; result != http.StatusUnauthorized {
			t.Errorf(`badRequest(%v) = %v, want %v`, test.err, result, http.StatusUnauthorized)
		}

		if result, _ := readBody(writer.Result().Body); string(result) != string(test.want) {
			t.Errorf(`unauthorized(%v) = %v, want %v`, test.err, string(result), string(test.want))
		}
	}
}

func TestForbidden(t *testing.T) {
	var tests = []struct {
	}{
		{},
	}

	for range tests {
		writer := httptest.NewRecorder()
		forbidden(writer)

		if result := writer.Result().StatusCode; result != http.StatusForbidden {
			t.Errorf(`forbidden() = %v, want %v`, result, http.StatusForbidden)
		}
	}
}

func TestErrorHandler(t *testing.T) {
	var tests = []struct {
		err  error
		want string
	}{
		{
			fmt.Errorf(`Internal server error`),
			`Internal server error
`,
		},
	}

	for _, test := range tests {
		writer := httptest.NewRecorder()
		errorHandler(writer, test.err)

		if result := writer.Result().StatusCode; result != http.StatusInternalServerError {
			t.Errorf(`errorHandler(%v) = %v, want %v`, test.err, result, http.StatusInternalServerError)
		}
	}
}
