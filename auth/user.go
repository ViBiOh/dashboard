package auth

import (
	"flag"
	"fmt"
	"strings"

	"github.com/ViBiOh/httputils"
)

// User of the app
type User struct {
	Username string
	profiles string
}

// HasProfile check if given User has given profile
func (user *User) HasProfile(profile string) bool {
	return strings.Contains(user.profiles, profile)
}

var users map[string]*User

var (
	authURL       = flag.String(`authUrl`, ``, `URL of auth service`)
	usersProfiles = flag.String(`users`, ``, `List of allowed users and profiles (e.g. user:profile1,profile2|user2:profile3`)
)

// Init auth
func Init() error {
	loadUsersProfiles(*usersProfiles)

	return nil
}

func loadUsersProfiles(usersAndProfiles string) {
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

		users[strings.ToLower(username)] = &User{username, profiles}
	}
}

// IsAuthenticatedByAuth check if Autorization Header matches a User
func IsAuthenticatedByAuth(authContent string) (*User, error) {
	username, err := httputils.GetBody(*authURL+`/user`, authContent)
	if err != nil {
		return nil, fmt.Errorf(`Error while getting username: %v`, err)
	}

	if user, ok := users[strings.ToLower(string(username))]; ok {
		return user, nil
	}

	return nil, fmt.Errorf(`[%s] Not allowed to use app`, username)
}
