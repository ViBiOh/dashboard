package oauth

import (
	"log"
	"net/http"
	"os"

	"github.com/ViBiOh/dashboard/fetch"
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
	body, err := fetch.ReadBody(r.Body)
	if err != nil {
		log.Printf(`Error while reading body: %v`, err)
	}

	log.Printf(`Code = %s`, body)
}
