package auth

import (
	"bufio"
	"bytes"
	"flag"
	"encoding/base64"
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"log"
	"os"
	"strings"
)

const basicPrefix = `Basic `

var commaByte = []byte(`,`)

// User of the app
type User struct {
	username string
	password []byte
	profile  string
}

var users map[string]*User

func init() {
	authFile := flag.String(`auth`, ``, `Path of authentification configuration file`)
	flag.Parse()

	users = readConfiguration(authFile)
}

func readConfiguration(path string) map[string]*User {
	configFile, err := os.Open(path)
	defer configFile.Close()

	if err != nil {
		log.Print(err)
		return nil
	}

	users := make(map[string]*User)

	scanner := bufio.NewScanner(configFile)
	for scanner.Scan() {
		parts := bytes.Split(scanner.Bytes(), commaByte)
		user := user{string(parts[0]), parts[1], string(parts[2])}

		users[strings.ToLower(user.username)] = &user
	}

	return users
}

func isAuthenticatedByBasicAuth(authContent string) (*User, error) {
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

	return isAuthenticated(dataStr[:sepIndex], dataStr[sepIndex+1:], true)
}

func isAuthenticated(username string, password string, ok bool) (*User, error) {
	if ok {
		user, ok := users[strings.ToLower(username)]

		if ok {
			if err := bcrypt.CompareHashAndPassword(user.password, []byte(password)); err == nil {
				return user, nil
			}
		}

		return nil, fmt.Errorf(`Invalid credentials for ` + username)
	}

	return nil, fmt.Errorf(`Unable to read basic authentication`)
}
