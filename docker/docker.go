package docker

import (
	"bufio"
	"bytes"
	"context"
	"github.com/ViBiOh/docker-deploy/jsonHttp"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"log"
	"net/http"
	"os"
	"regexp"
)

const host = `DOCKER_HOST`
const version = `DOCKER_VERSION`

var commaByte = []byte(`,`)
var containersRequest = regexp.MustCompile(`^/containers$`)

type results struct {
	Results interface{} `json:"results"`
}

type user struct {
	username string
	password string
}

var docker *client.Client
var users map[string]*user

func readConfiguration(path string) map[string]*user {
	configFile, err := os.Open(path)
	defer configFile.Close()

	if err != nil {
		log.Fatal(err)
	}

	users := make(map[string]*user)

	scanner := bufio.NewScanner(configFile)
	for scanner.Scan() {
		parts := bytes.Split(scanner.Bytes(), commaByte)
		user := user{string(parts[0]), string(parts[1])}

		users[user.username] = &user
	}

	return users
}

func init() {
	users = readConfiguration(`./users`)

	client, err := client.NewClient(os.Getenv(host), os.Getenv(version), nil, nil)
	if err != nil {
		log.Fatal(err)
	} else {
		docker = client
	}
}

func listContainers() []types.Container {
	containers, err := docker.ContainerList(context.Background(), types.ContainerListOptions{})
	if err != nil {
		log.Fatal(err)
		return nil
	}

	return containers
}

func containersHandler(w http.ResponseWriter) {
	jsonHttp.ResponseJSON(w, results{listContainers()})
}

func isAuthenticated(r *http.Request) bool {
	username, password, ok := r.BasicAuth()

	log.Print(username)
	log.Print(password)

	if ok {
		user, ok := users[username]

		if ok && user.password == password {
			return ok
		}
	}

	return false
}

func authHandler(w http.ResponseWriter) {
	http.Error(w, `Authentication required`, http.StatusUnauthorized)
}

// Handler for Hello request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(`Access-Control-Allow-Origin`, `*`)
	w.Header().Add(`Access-Control-Allow-Headers`, `Content-Type, Authorization`)
	w.Header().Add(`Access-Control-Allow-Methods`, `GET, POST`)
	w.Header().Add(`X-Content-Type-Options`, `nosniff`)

	if r.Method == http.MethodOptions {
		w.Write(nil)
		return
	}

	urlPath := []byte(r.URL.Path)

	if containersRequest.Match(urlPath) && r.Method == http.MethodGet {
		containersHandler(w)
	} else if isAuthenticated(r) {
		jsonHttp.ResponseJSON(w, results{listContainers()})
	} else {
		authHandler(w)
	}
}
