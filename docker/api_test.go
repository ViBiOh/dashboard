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
			t.Errorf("badRequest(%v) = %v, want %v", test.err, result, http.StatusBadRequest)
		}

		if result, _ := readBody(writer.Result().Body); string(result) != string(test.want) {
			t.Errorf("badRequest(%v) = %v, want %v", test.err, string(result), string(test.want))
		}
	}
}
