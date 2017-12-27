package docker

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/ViBiOh/auth/auth"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/gorilla/websocket"
)

const (
	ignoredByteLogSize = 8
	tailSize           = `100`
	start              = `start`
	stop               = `stop`
	busPrefix          = `/bus`
)

var (
	eventsDemand = regexp.MustCompile(`^events (\S+)`)
	logsDemand   = regexp.MustCompile(`^logs (\S+)(?: (.+))?`)
	statsDemand  = regexp.MustCompile(`^stats (\S+)(?: (.+))?`)
)

var (
	eventsPrefix = []byte(`events `)
	logsPrefix   = []byte(`logs `)
	statsPrefix  = []byte(`stats `)
)

var (
	hostCheck       *regexp.Regexp
	websocketOrigin = flag.String(`ws`, `^dashboard`, `Allowed WebSocket Origin pattern`)
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return hostCheck.MatchString(r.Host)
	},
}

// InitWebsocket configure websocket handler
func InitWebsocket() error {
	hostCheck = regexp.MustCompile(*websocketOrigin)

	return nil
}

func upgradeAndAuth(w http.ResponseWriter, r *http.Request, authURL string, authUsers map[string]*auth.User) (*websocket.Conn, *auth.User, error) {
	ws, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		if ws != nil {
			defer ws.Close()
		}

		return nil, nil, fmt.Errorf(`Error while upgrading connection: %v`, err)
	}

	_, basicAuth, err := ws.ReadMessage()
	if err != nil {
		defer ws.Close()
		return nil, nil, fmt.Errorf(`Error while reading authentification message: %v`, err)
	}

	user, err := auth.IsAuthenticatedByAuth(authURL, authUsers, string(basicAuth), ws.RemoteAddr().String())
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(err.Error()))
		defer ws.Close()
		return nil, nil, fmt.Errorf(`Error while checking authentification: %v`, err)
	}

	return ws, user, nil
}

func readContent(user *auth.User, ws *websocket.Conn, name string, done chan<- struct{}, content chan<- []byte) {
	for {
		messageType, message, err := ws.ReadMessage()

		if messageType == websocket.CloseMessage {
			close(done)
			return
		}

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived, websocket.CloseAbnormalClosure) {
				log.Printf(`[%s] Error while reading from %s socket: %v`, user.Username, name, err)
			}

			close(done)
			return
		}

		content <- message
	}
}

func streamEvents(ctx context.Context, cancel context.CancelFunc, user *auth.User, _ string, output chan<- []byte) {
	defer cancel()

	filtersArgs := filters.NewArgs()
	labelFilters(user, &filtersArgs, ``)
	eventFilters(&filtersArgs)

	messages, errors := docker.Events(ctx, types.EventsOptions{Filters: filtersArgs})

	for {
		select {
		case <-ctx.Done():
			return

		case message := <-messages:
			messageJSON, err := json.Marshal(message)
			if err != nil {
				log.Printf(`[%s] Events marshalling in error: %v`, user.Username, err)
				cancel()
			} else {
				output <- append(eventsPrefix, messageJSON...)
			}

		case err := <-errors:
			log.Printf(`[%s] Events reading in error: %v`, user.Username, err)
			cancel()
		}
	}
}

func streamLogs(ctx context.Context, cancel context.CancelFunc, user *auth.User, containerID string, output chan<- []byte) {
	logs, err := docker.ContainerLogs(ctx, containerID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: true, Tail: tailSize})
	defer cancel()

	if err != nil {
		log.Printf(`[%s] Logs opening in error: %v`, user.Username, err)
		return
	}
	defer logs.Close()

	scanner := bufio.NewScanner(logs)
	for scanner.Scan() {
		logLine := scanner.Bytes()
		if len(logLine) > ignoredByteLogSize {
			output <- append(logsPrefix, logLine[ignoredByteLogSize:]...)
		}
	}
}

func streamStats(ctx context.Context, cancel context.CancelFunc, user *auth.User, containerID string, output chan<- []byte) {
	stats, err := docker.ContainerStats(ctx, containerID, true)
	defer cancel()

	if err != nil {
		log.Printf(`[%s] Stats opening in error for %s: %v`, user.Username, containerID, err)
		return
	}
	defer stats.Body.Close()

	scanner := bufio.NewScanner(stats.Body)
	for scanner.Scan() {
		output <- append(statsPrefix, scanner.Bytes()...)
	}
}

func handleBusDemand(user *auth.User, name string, input []byte, demand *regexp.Regexp, cancel context.CancelFunc, output chan<- []byte, streamFn func(context.Context, context.CancelFunc, *auth.User, string, chan<- []byte)) context.CancelFunc {
	demandGroups := demand.FindSubmatch(input)
	if len(demandGroups) < 2 {
		log.Printf(`[%s] Unable to parse bus demand %s for %s`, user.Username, input, name)
	}

	action := string(demandGroups[1])

	containerID := ``
	if len(demandGroups) > 2 {
		containerID = string(demandGroups[2])
	}

	if action == stop && cancel != nil {
		cancel()
	} else if action == start {
		if cancel != nil {
			cancel()
		}

		ctx, newCancel := context.WithCancel(context.Background())
		go streamFn(ctx, newCancel, user, string(containerID), output)

		return newCancel
	}

	return nil
}

func busWebsocketHandler(w http.ResponseWriter, r *http.Request, authURL string, authUsers map[string]*auth.User) {
	ws, user, err := upgradeAndAuth(w, r, authURL, authUsers)
	if err != nil {
		log.Printf(`Error while upgrading connection to websocket: %v`, err)
		return
	}
	defer ws.Close()

	done := make(chan struct{})

	output := make(chan []byte)
	defer close(output)

	input := make(chan []byte)
	defer close(input)

	go readContent(user, ws, `streaming`, done, input)

	var eventsCancelFunc context.CancelFunc
	var logsCancelFunc context.CancelFunc
	var statsCancelFunc context.CancelFunc

	if err = ws.WriteMessage(websocket.TextMessage, []byte(`ready`)); err != nil {
		log.Printf(`[%s] Error while saying ready: %v`, user.Username, err)
	}

	for {
		select {
		case <-done:
			return

		case inputBytes := <-input:
			if eventsDemand.Match(inputBytes) {
				eventsCancelFunc = handleBusDemand(user, `events`, inputBytes, eventsDemand, eventsCancelFunc, output, streamEvents)
				if eventsCancelFunc != nil {
					defer eventsCancelFunc()
				}
			} else if logsDemand.Match(inputBytes) {
				logsCancelFunc = handleBusDemand(user, `logs`, inputBytes, logsDemand, logsCancelFunc, output, streamLogs)
				if logsCancelFunc != nil {
					defer logsCancelFunc()
				}
			} else if statsDemand.Match(inputBytes) {
				statsCancelFunc = handleBusDemand(user, `stats`, inputBytes, statsDemand, statsCancelFunc, output, streamStats)
				if statsCancelFunc != nil {
					defer statsCancelFunc()
				}
			}

		case outputBytes := <-output:
			if err = ws.WriteMessage(websocket.TextMessage, outputBytes); err != nil {
				log.Printf(`[%s] Error while writing to streaming: %v`, user.Username, err)
				close(done)
			}
		}
	}
}

// WebsocketHandler for Docker Websocket request. Should be use with net/http
func WebsocketHandler(authConfig map[string]*string) http.Handler {
	authURL := *authConfig[`url`]
	authUsers := auth.LoadUsersProfiles(*authConfig[`users`])

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, busPrefix) {
			busWebsocketHandler(w, r, authURL, authUsers)
		}
	})
}
