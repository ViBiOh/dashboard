package docker

import (
	"bufio"
	"bytes"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"strings"
)

const configurationFile = `./users`
const admin = `admin`

var commaByte = []byte(`,`)

type user struct {
	username string
	password string
	role     string
}

var users map[string]*user

func init() {
	users = readConfiguration(configurationFile)
}

func readConfiguration(path string) map[string]*user {
	configFile, err := os.Open(path)
	defer configFile.Close()

	if err != nil {
		log.Print(err)
		return nil
	}

	users := make(map[string]*user)

	scanner := bufio.NewScanner(configFile)
	for scanner.Scan() {
		parts := bytes.Split(scanner.Bytes(), commaByte)
		user := user{string(parts[0]), string(parts[1]), string(parts[2])}

		users[strings.ToLower(user.username)] = &user
	}

	return users
}

func isAllowed(loggedUser *user, containerID string) (bool, error) {
	if !isAdmin(loggedUser) {
		container, err := inspectContainer(string(containerID))
		if err != nil {
			return false, err
		}

		owner, ok := container.Config.Labels[ownerLabel]
		if !ok || owner != loggedUser.username {
			return false, nil
		}
	}

	return true, nil
}

func isAuthenticatedByBasicAuth(base64value string) (*user, error) {
	data, err := base64.StdEncoding.DecodeString(base64value)
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

func isAuthenticated(username string, password string, ok bool) (*user, error) {
	if ok {
		user, ok := users[strings.ToLower(username)]

		if ok && user.password == password {
			return user, nil
		}
		return nil, fmt.Errorf(`Invalid credentials for ` + username)
	}

	return nil, fmt.Errorf(`Unable to read basic authentication`)
}

func isAdmin(loggedUser *user) bool {
	if loggedUser != nil {
		return loggedUser.role == admin
	}
	return false
}
