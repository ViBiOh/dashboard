package httputils

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type results struct {
	Results interface{} `json:"results"`
}

// ResponseJSON write marshalled obj to http.ResponseWriter with correct header
func ResponseJSON(w http.ResponseWriter, obj interface{}) {
	if objJSON, err := json.Marshal(obj); err == nil {
		w.Header().Set(`Content-Type`, `application/json`)
		w.Header().Set(`Cache-Control`, `no-cache`)
		w.Write(objJSON)
	} else {
		InternalServer(w, fmt.Errorf(`Error while marshalling JSON response: %v`, err))
	}
}

// ResponseArrayJSON write marshalled obj wrapped into an object to http.ResponseWriter with correct header
func ResponseArrayJSON(w http.ResponseWriter, array interface{}) {
	if objJSON, err := json.Marshal(results{array}); err == nil {
		w.Header().Set(`Content-Type`, `application/json`)
		w.Header().Set(`Cache-Control`, `no-cache`)
		w.Write(objJSON)
	} else {
		InternalServer(w, fmt.Errorf(`Error while marshalling JSON response: %v`, err))
	}
}
