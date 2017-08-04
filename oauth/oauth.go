package oauth

import (
	"net/http"
	"strings"

	github "github.com/ViBiOh/dashboard/oauth/github"
)

const githubPrefix = `/github`

var githubHandler = http.StripPrefix(githubPrefix, github.Handler{})

// Init configure OAuth provided
func Init() {
	github.Init()
}

// Handler for OAuth request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, githubPrefix) {
		githubHandler.ServeHTTP(w, r)
	}
}
