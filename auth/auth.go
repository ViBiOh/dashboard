package auth

import (
	"flag"
	"fmt"
	"net/http"
	"strings"

	"github.com/ViBiOh/httputils"
)

const authorizationHeader = `Authorization`
const forwardedForHeader = `X-Forwarded-For`

// User of the app
type User struct {
	Username string
	profiles string
}

// HasProfile check if given User has given profile
func (user *User) HasProfile(profile string) bool {
	return strings.Contains(user.profiles, profile)
}

// NewUser creates new user with username and profiles
func NewUser(username string, profiles string) *User {
	return &User{username, profiles}
}

var users map[string]*User

var (
	authURL       = flag.String(`authUrl`, ``, `URL of auth service`)
	usersProfiles = flag.String(`users`, ``, `List of allowed users and profiles (e.g. user:profile1,profile2|user2:profile3`)
)

// Init auth
func Init() error {
	LoadUsersProfiles(*usersProfiles)

	return nil
}

// LoadUsersProfiles parses users ands profiles from given string
func LoadUsersProfiles(usersAndProfiles string) {
	users = make(map[string]*User, 0)

	if usersAndProfiles == `` {
		return
	}

	usersList := strings.Split(usersAndProfiles, `|`)
	for _, user := range usersList {
		username := user
		profiles := ``

		sepIndex := strings.Index(user, `:`)
		if sepIndex != -1 {
			username = user[:sepIndex]
			profiles = user[sepIndex+1:]
		}

		users[strings.ToLower(username)] = NewUser(username, profiles)
	}
}

func getRemoteIP(r *http.Request) string {
	if r == nil {
		return ``
	}

	ip := r.Header.Get(forwardedForHeader)
	if ip == `` {
		ip = r.RemoteAddr
	}

	return ip
}

// IsAuthenticated check if request has correct headers for authentification
func IsAuthenticated(r *http.Request) (*User, error) {
	return IsAuthenticatedByAuth(r.Header.Get(authorizationHeader), r)
}

// IsAuthenticatedByAuth check if authorization is correct
func IsAuthenticatedByAuth(authContent string, r *http.Request) (*User, error) {
	headers := map[string]string{
		authorizationHeader: authContent,
		forwardedForHeader:  getRemoteIP(r),
	}

	username, err := httputils.GetBody(*authURL+`/user`, headers, true)
	if err != nil {
		return nil, fmt.Errorf(`Error while getting username: %v`, err)
	}

	if user, ok := users[strings.ToLower(string(username))]; ok {
		return user, nil
	}

	return nil, fmt.Errorf(`[%s] Not allowed to use app`, username)
}
