package httpclient

import (
	"net/http"
	"time"
)

var httpClient = http.Client{Timeout: 5 * time.Second}

// GetStatusCode return status code of a GET on given url
func GetStatusCode(url string) (int, error) {
	request, err := http.NewRequest(`GET`, url, nil)
	if err != nil {
		return 0, err
	}

	response, err := httpClient.Do(request)
	if err != nil {
		return 0, err
	}

	defer response.Body.Close()

	return response.StatusCode, nil
}
