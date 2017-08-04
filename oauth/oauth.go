package oauth

import (
	"log"
	"net/http"
	"os"
)

const accessTokenURL = `https://github.com/login/oauth/access_token`

var stateSalt string

func Init() {
	stateSalt = os.Getenv(`OAUTH_STATE_SALT`)
}

// Handler for Docker request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Printf(`Path = %s`, r.URL.Path)
}
