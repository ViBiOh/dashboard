package github

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/http"

	"github.com/ViBiOh/dashboard/httputils"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

const userURL = `https://api.github.com/user`

type user struct {
	Login string `json:"login"`
}

var (
	state        = flag.String(`githubState`, ``, `GitHub OAuth State`)
	clientID     = flag.String(`githubClientId`, ``, `GitHub OAuth Client ID`)
	clientSecret = flag.String(`githubClientSecret`, ``, `GitHub OAuth Client Secret`)
	oauthConf    *oauth2.Config
)

// Init configuration
func Init() error {
	if *clientID != `` {
		oauthConf = &oauth2.Config{
			ClientID:     *clientID,
			ClientSecret: *clientSecret,
			Endpoint:     github.Endpoint,
		}
	}

	return nil
}

func getAccessToken(requestState string, requestCode string) (string, error) {
	if *state != requestState {
		return ``, fmt.Errorf(`Invalid state provided for oauth`)
	}

	token, err := oauthConf.Exchange(oauth2.NoContext, requestCode)
	if err != nil {
		return ``, fmt.Errorf(`Invalid code provided for oauth`)
	}

	return token.AccessToken, nil
}

func getUsername(token string) (string, error) {
	userResponse, err := httputils.GetBody(userURL, `token `+token)
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
	if r.URL.Path == `/user` {
		if username, err := getUsername(r.Header.Get(`Authorization`)); err != nil {
			httputils.Unauthorized(w, err)
		} else {
			w.Write([]byte(username))
		}
	} else if r.URL.Path == `/access_token` {
		if token, err := getAccessToken(r.FormValue(`state`), r.FormValue(`code`)); err != nil {
			httputils.Unauthorized(w, err)
		} else {
			w.Write([]byte(token))
		}
	}
}
