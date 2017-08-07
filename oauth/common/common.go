package common

import (
	"log"
	"net/http"
)

// Unauthorized logs error and set Unauthorized header
func Unauthorized(w http.ResponseWriter, err error) {
	log.Printf(`HTTP/401 %v`, err)
	http.Error(w, err.Error(), http.StatusUnauthorized)
}
