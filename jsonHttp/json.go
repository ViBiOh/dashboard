package jsonHttp

import "net/http"
import "encoding/json"

// ResponseJSON write marshalled obj to http.ResponseWriter with correct header
func ResponseJSON(w http.ResponseWriter, obj interface{}) {
	objJSON, err := json.Marshal(obj)

	if err == nil {
		w.Header().Set(`Content-Type`, `application/json`)
		w.Header().Set(`Cache-Control`, `no-cache`)
		w.Header().Set(`Access-Control-Allow-Origin`, `*`)
		w.Write(objJSON)
	} else {
		http.Error(w, `Error while marshalling JSON response`, http.StatusInternalServerError)
	}
}
