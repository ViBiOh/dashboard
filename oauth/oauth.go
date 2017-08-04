package oauth

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/ViBiOh/dashboard/fetch"
)

const accessTokenURL = `https://github.com/login/oauth/access_token?`

var (
	stateSalt    string
	clientID     string
	clientSecret string
)

// Init retrieve env variables
func Init() {
	stateSalt = os.Getenv(`OAUTH_STATE_SALT`)
	clientID = os.Getenv(`GITHUB_OAUTH_CLIENT_ID`)
	stateSalt = os.Getenv(`GITHUB_OAUTH_CLIENT_SECRET`)
}

func getAccessToken(code string) ([]byte, error) {
	url := accessTokenURL + `client_id=` + clientID + `&client_secret=` + clientSecret + `&code=` + code
	result, err := fetch.Post(url)
	if err != nil {
		return nil, fmt.Errorf(`Error while requesting access token %s: %v`, url, err)
	}

	return result, nil
}

// Handler for Docker request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	accessToken, err := getAccessToken(r.URL.Query().Get(`code`))
	if err != nil {
		log.Printf(`Error while getting access token: %v`, err)
	}

	log.Printf(`Access token is %s`, accessToken)
}
