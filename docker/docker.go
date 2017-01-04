package docker

import (
	"bufio"
	"bytes"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
)

var containersRequest = regexp.MustCompile(`/containers/?$`)
var containerRequest = regexp.MustCompile(`/containers/([^/]+)/?$`)
var startRequest = regexp.MustCompile(`/containers/([^/]+)/start`)
var stopRequest = regexp.MustCompile(`/containers/([^/]+)/stop`)
var restartRequest = regexp.MustCompile(`/containers/([^/]+)/restart`)
var logRequest = regexp.MustCompile(`/containers/([^/]+)/logs`)

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
	if loggedUser.role != admin {
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

func isAuthenticated(r *http.Request) (*user, error) {
	username, password, ok := r.BasicAuth()

	if ok {
		user, ok := users[strings.ToLower(username)]

		if ok && user.password == password {
			return user, nil
		}
		return nil, fmt.Errorf(`Invalid credentials for ` + username)
	}

	return nil, fmt.Errorf(`Unable to read basic authentication`)
}

func handle(w http.ResponseWriter, r *http.Request, loggedUser *user) {
	urlPath := []byte(r.URL.Path)

	if containersRequest.Match(urlPath) && r.Method == http.MethodGet {
		listContainersHandler(w, loggedUser)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodGet {
		inspectContainerHandler(w, containerRequest.FindSubmatch(urlPath)[1])
	} else if startRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, loggedUser, startRequest.FindSubmatch(urlPath)[1], startContainer)
	} else if stopRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, loggedUser, stopRequest.FindSubmatch(urlPath)[1], stopContainer)
	} else if restartRequest.Match(urlPath) && r.Method == http.MethodPost {
		basicActionHandler(w, loggedUser, restartRequest.FindSubmatch(urlPath)[1], restartContainer)
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodDelete {
		basicActionHandler(w, loggedUser, containerRequest.FindSubmatch(urlPath)[1], rmContainer)
	} else if logRequest.Match(urlPath) && r.Method == http.MethodGet {
		logContainerHandler(w, logRequest.FindSubmatch(urlPath)[1])
	} else if containerRequest.Match(urlPath) && r.Method == http.MethodPost {
		if composeBody, err := readBody(r.Body); err != nil {
			errorHandler(w, err)
		} else {
			createAppHandler(w, loggedUser, containerRequest.FindSubmatch(urlPath)[1], composeBody)
		}
	}
}
