package docker

import (
	"log"
	"net/http"
	"strings"
)

const websocketPrefix = `/ws`

func errorHandler(w http.ResponseWriter, err error) {
	log.Print(err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func unauthorized(w http.ResponseWriter, err error) {
	http.Error(w, err.Error(), http.StatusUnauthorized)
}

func forbidden(w http.ResponseWriter) {
	http.Error(w, `Forbidden`, http.StatusForbidden)
}

// Handler for Docker request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(`Access-Control-Allow-Origin`, `*`)
	w.Header().Add(`Access-Control-Allow-Headers`, `Content-Type, Authorization`)
	w.Header().Add(`Access-Control-Allow-Methods`, `GET, POST, DELETE`)
	w.Header().Add(`X-Content-Type-Options`, `nosniff`)

	if r.Method == http.MethodOptions {
		w.Write(nil)
		return
	}

	if strings.HasPrefix(r.URL.Path, websocketPrefix) {
		http.StripPrefix(websocketPrefix, WebsocketHandler{})
	} else {
		loggedUser, err := isAuthenticated(r.BasicAuth())
		if err != nil {
			unauthorized(w, err)
			return
		}

		handle(w, r, loggedUser)
	}
}
