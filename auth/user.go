package auth

import (
	"bufio"
	"bytes"
	"encoding/base64"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/ViBiOh/dashboard/fetch"
	"golang.org/x/crypto/bcrypt"
)

const basicPrefix = `Basic `
const githubPrefix = `GitHub `

// User of the app
type User struct {
	Username string
	password []byte
	profiles string
}

// HasProfile check if given User has given profile
func (user *User) HasProfile(profile string) bool {
	return strings.Contains(user.profiles, profile)
}

var users map[string]*User

var (
	authFile = flag.String(`auth`, ``, `Path of authentification file`)
	oauthURL = flag.String(`oauthUrl`, ``, `URL of oauth service`)
)

// Init auth
func Init() {
	LoadAuthFile(*authFile)
}

// LoadAuthFile loads given file into users map
func LoadAuthFile(path string) {
	users = make(map[string]*User)

	configFile, err := os.Open(path)
	defer configFile.Close()

	if err != nil {
		log.Print(err)
	}

	scanner := bufio.NewScanner(configFile)
	for scanner.Scan() {
		parts := bytes.Split(scanner.Bytes(), []byte(`,`))
		user := User{strings.ToLower(string(parts[0])), parts[1], string(parts[2])}

		users[strings.ToLower(user.Username)] = &user
	}
}

func isAuthenticated(username string, password string) (*User, error) {
	user, ok := users[strings.ToLower(username)]

	if ok {
		if err := bcrypt.CompareHashAndPassword(user.password, []byte(password)); err == nil {
			return user, nil
		}
	}

	return nil, fmt.Errorf(`[%s] Invalid credentials`, username)
}

func isAuthenticatedByBasicAuth(authContent string) (*User, error) {
	data, err := base64.StdEncoding.DecodeString(authContent)
	if err != nil {
		return nil, fmt.Errorf(`Error while decoding basic authentication: %v`, err)
	}

	dataStr := string(data)

	sepIndex := strings.Index(dataStr, `:`)
	if sepIndex < 0 {
		return nil, fmt.Errorf(`Error while reading basic authentication`)
	}

	return isAuthenticated(dataStr[:sepIndex], dataStr[sepIndex+1:])
}

func isAuthenticatedByGithubAuth(authContent string) (*User, error) {
	username, err := fetch.GetBody(*oauthURL+`/github/user`, authContent)
	if err != nil {
		return nil, fmt.Errorf(`Error while reading github authentication: %v`, err)
	}

	if user, ok := users[string(username)]; ok {
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
