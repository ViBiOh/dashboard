package github

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/ViBiOh/dashboard/fetch"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

const userURL = `https://api.github.com/user`

type user struct {
	Login string `json:"login"`
}

var (
	state     string
	oauthConf *oauth2.Config
)

// Init configuration
func Init() {
	state = os.Getenv(`GITHUB_OAUTH_STATE`)

	oauthConf = &oauth2.Config{
		ClientID:     os.Getenv(`GITHUB_OAUTH_CLIENT_ID`),
		ClientSecret: os.Getenv(`GITHUB_OAUTH_CLIENT_SECRET`),
		Endpoint:     github.Endpoint,
	}
}

func getAccessToken(requestState string, requestCode string) (*oauth2.Token, error) {
	if state != requestState {
		return nil, fmt.Errorf(`Invalid state provided for oauth`)
	}

	token, err := oauthConf.Exchange(oauth2.NoContext, requestCode)
	if err != nil {
		return nil, fmt.Errorf(`Invalid code provided for oauth`)
	}

	return token, nil
}

func getUsername(token *oauth2.Token) (string, error) {
	userResponse, err := fetch.GetBody(userURL, token.AccessToken)
	if err != nil {
		return ``, fmt.Errorf(`Error while fetching user informations: %v`, err)
	}

	user := user{}
	if err := json.Unmarshal(userResponse, &user); err != nil {
		return ``, fmt.Errorf(`Error while unmarshalling user informations: %v`, err)
	}

	return user.Login, nil
}

// Handler for Github OAuth request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == `/access_token` {
		if token, err := getAccessToken(r.FormValue(`state`), r.FormValue(`code`)); err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
		} else {
			log.Printf(`Token: %s`, token.AccessToken)
			w.Write([]byte(token.AccessToken))
		}
	}
}
