package docker

import (
	"github.com/docker/docker/client"
	"log"
	"net/http"
	"os"
	"regexp"
)

const host = `DOCKER_HOST`
const version = `DOCKER_VERSION`
const configurationFile = `./users`
const admin = `admin`
const ownerLabel = `owner`
const appLabel = `app`

var commaByte = []byte(`,`)
var splitLogs = regexp.MustCompile(`.{8}(.*?)\n`)

type results struct {
	Results interface{} `json:"results"`
}

var docker *client.Client

func errorHandler(w http.ResponseWriter, err error) {
	log.Print(err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func init() {
	client, err := client.NewClient(os.Getenv(host), os.Getenv(version), nil, nil)
	if err != nil {
		log.Fatal(err)
	} else {
		docker = client
	}
}

func unauthorized(w http.ResponseWriter, err error) {
	http.Error(w, err.Error(), http.StatusUnauthorized)
}

func forbidden(w http.ResponseWriter) {
	http.Error(w, `Forbidden`, http.StatusForbidden)
}

// Handler for Hello request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add(`Access-Control-Allow-Origin`, `*`)
	w.Header().Add(`Access-Control-Allow-Headers`, `Content-Type, Authorization`)
	w.Header().Add(`Access-Control-Allow-Methods`, `GET, POST, DELETE`)
	w.Header().Add(`X-Content-Type-Options`, `nosniff`)

	if r.Method == http.MethodOptions {
		w.Write(nil)
		return
	}

	loggedUser, err := isAuthenticated(r)
	if err != nil {
		unauthorized(w, err)
		return
	}

	handle(w, r, loggedUser)
}
