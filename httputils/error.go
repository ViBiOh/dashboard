package httputils

import (
	"log"
	"net/http"
)

// BadRequest logs error and sets BadRequest status
func BadRequest(w http.ResponseWriter, err error) {
	log.Printf(`HTTP/400 %v`, err)
	http.Error(w, err.Error(), http.StatusBadRequest)
}

// Unauthorized logs error and sets Unauthorized status
func Unauthorized(w http.ResponseWriter, err error) {
	log.Printf(`HTTP/401 %v`, err)
	http.Error(w, err.Error(), http.StatusUnauthorized)
}

// Forbidden sets Forbidden status
func Forbidden(w http.ResponseWriter) {
	http.Error(w, ``, http.StatusForbidden)
}

// InternalServer logs error and sets InternalServer status
func InternalServer(w http.ResponseWriter, err error) {
	log.Printf(`HTTP/500 %v`, err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
}
