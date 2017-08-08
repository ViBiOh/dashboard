package basic

import (
	"bufio"
	"bytes"
	"encoding/base64"
	"flag"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/ViBiOh/httputils"
	"golang.org/x/crypto/bcrypt"
)

// User of the app
type User struct {
	Username string
	password []byte
}

var users map[string]*User

var (
	authFile = flag.String(`basicFile`, ``, `Path of authentification file`)
)

// Init auth
func Init() error {
	if *authFile != `` {
		if err := LoadAuthFile(*authFile); err != nil {
			return err
		}
	}

	return nil
}

// LoadAuthFile loads given file into users map
func LoadAuthFile(path string) error {
	users = make(map[string]*User)

	configFile, err := os.Open(path)
	if err != nil {
		return fmt.Errorf(`Error while opening auth file: %v`, err)
	}

	defer configFile.Close()

	scanner := bufio.NewScanner(configFile)
	for scanner.Scan() {
		parts := bytes.Split(scanner.Bytes(), []byte(`,`))
		user := User{strings.ToLower(string(parts[0])), parts[1]}

		users[strings.ToLower(user.Username)] = &user
	}

	return nil
}

func getUsername(header string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(header)
	if err != nil {
		return ``, fmt.Errorf(`Error while decoding basic authentication: %v`, err)
	}

	dataStr := string(data)

	sepIndex := strings.Index(dataStr, `:`)
	if sepIndex < 0 {
		return ``, fmt.Errorf(`Error while reading basic authentication`)
	}

	username := dataStr[:sepIndex]
	password := dataStr[sepIndex+1:]

	if user, ok := users[strings.ToLower(username)]; ok {
		if err := bcrypt.CompareHashAndPassword(user.password, []byte(password)); err != nil {
			return ``, fmt.Errorf(`Invalid credentials for %s`, username)
		}
	}

	return username, nil
}

// Handler for Github OAuth request. Should be use with net/http
type Handler struct {
}

func (handler Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == `/user` {
		if username, err := getUsername(r.Header.Get(`Authorization`)); err != nil {
			httputils.Unauthorized(w, err)
		} else {
			w.Write([]byte(username))
		}
	}
}
