package auth

import (
	"bufio"
	"bytes"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

const basicPrefix = `Basic `

var commaByte = []byte(`,`)

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

var users map[string]User

// Init auth
func Init(authFile string) {
	users = readConfiguration(authFile)
}

func readConfiguration(path string) map[string]User {
	configFile, err := os.Open(path)
	defer configFile.Close()

	if err != nil {
		log.Print(err)
		return nil
	}

	users := make(map[string]User)

	scanner := bufio.NewScanner(configFile)
	for scanner.Scan() {
		parts := bytes.Split(scanner.Bytes(), commaByte)
		user := User{strings.ToLower(string(parts[0])), parts[1], string(parts[2])}

		users[strings.ToLower(user.Username)] = user
	}

	return users
}

func isAuthenticated(username string, password string) (*User, error) {
	user, ok := users[strings.ToLower(username)]

	if ok {
		if err := bcrypt.CompareHashAndPassword(user.password, []byte(password)); err == nil {
			return &user, nil
		}
	}

	return nil, fmt.Errorf(`[%s] Invalid credentials`, username)
}

// IsAuthenticatedByAuth check if Autorization Header matches a User
func IsAuthenticatedByAuth(authContent string) (*User, error) {
	if !strings.HasPrefix(authContent, basicPrefix) {
		return nil, fmt.Errorf(`Unable to read authentication type`)
	}

	data, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(authContent, basicPrefix))
	if err != nil {
		return nil, fmt.Errorf(`Unable to read basic authentication`)
	}

	dataStr := string(data)

	sepIndex := strings.IndexByte(dataStr, ':')
	if sepIndex < 0 {
		return nil, fmt.Errorf(`Unable to read basic authentication`)
	}

	return isAuthenticated(dataStr[:sepIndex], dataStr[sepIndex+1:])
}
