package auth

import (
	"flag"
	"fmt"
	"strings"

	"github.com/ViBiOh/dashboard/fetch"
)

const basicPrefix = `Basic `
const githubPrefix = `GitHub `

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
func Init() {
	LoadUsersProfiles(*usersProfiles)
}

// LoadUsersProfiles load string chain of users and profiles
func LoadUsersProfiles(usersAndProfiles string) {
	users = make(map[string]*User, 0)

	usersList := strings.Split(usersAndProfiles, `|`)
	for _, user := range usersList {
		sepIndex := strings.Index(user, `:`)

		username := user[:sepIndex]
		users[strings.ToLower(username)] = &User{username, user[sepIndex+1:]}
	}
}

func isAuthenticatedByBasicAuth(authContent string) (*User, error) {
	username, err := fetch.GetBody(*authURL+`/basic/user`, authContent)
	if err != nil {
		return nil, fmt.Errorf(`Error while reading file authentication: %v`, err)
	}

	if user, ok := users[strings.ToLower(string(username))]; ok {
		return user, nil
	}

	return nil, fmt.Errorf(`[%s] Not allowed to use app`, username)
}

func isAuthenticatedByGithubAuth(authContent string) (*User, error) {
	username, err := fetch.GetBody(*authURL+`/github/user`, authContent)
	if err != nil {
		return nil, fmt.Errorf(`Error while reading github authentication: %v`, err)
	}

	if user, ok := users[strings.ToLower(string(username))]; ok {
		return user, nil
	}

	return nil, fmt.Errorf(`[%s] Not allowed to use app`, username)
}

// IsAuthenticatedByAuth check if Autorization Header matches a User
func IsAuthenticatedByAuth(authContent string) (*User, error) {
	if strings.HasPrefix(authContent, basicPrefix) {
		return isAuthenticatedByBasicAuth(strings.TrimPrefix(authContent, basicPrefix))
	} else if strings.HasPrefix(authContent, githubPrefix) {
		return isAuthenticatedByGithubAuth(strings.TrimPrefix(authContent, githubPrefix))
	}

	return nil, fmt.Errorf(`Unable to read authentication type`)
}
