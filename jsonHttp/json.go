package jsonHttp

import (
	"encoding/json"
	"log"
	"net/http"
)

// ResponseJSON write marshalled obj to http.ResponseWriter with correct header
func ResponseJSON(w http.ResponseWriter, obj interface{}) {
	objJSON, err := json.Marshal(obj)

	if err == nil {
		w.Header().Set(`Content-Type`, `application/json`)
		w.Header().Set(`Cache-Control`, `no-cache`)
		w.Write(objJSON)
	} else {
		log.Print(err)
		http.Error(w, `Error while marshalling JSON response`, http.StatusInternalServerError)
	}
}
