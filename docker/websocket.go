package docker

import (
	"bufio"
	"context"
	"encoding/json"
	"github.com/ViBiOh/dashboard/auth"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"regexp"
)

const ignoredByteLogSize = 8
const tailSize = `100`
const start = `start`
const stop = `stop`

var eventsDemand = regexp.MustCompile(`^events (\S+)`)
var logsDemand = regexp.MustCompile(`^logs (\S+)(?: (.+))?`)
var statsDemand = regexp.MustCompile(`^stats (\S+)(?: (.+))?`)
var busWebsocketRequest = regexp.MustCompile(`bus`)
var eventsPrefix = []byte(`events `)
var logsPrefix = []byte(`logs `)
var statsPrefix = []byte(`stats `)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return hostCheck.MatchString(r.Host)
	},
}

func upgradeAndAuth(w http.ResponseWriter, r *http.Request) (*websocket.Conn, *auth.User, error) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		defer ws.Close()
		return nil, nil, err
	}

	_, basicAuth, err := ws.ReadMessage()
	if err != nil {
		defer ws.Close()
		return nil, nil, err
	}

	user, err := auth.IsAuthenticatedByAuth(string(basicAuth))
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(err.Error()))

		defer ws.Close()
		return nil, nil, err
	}

	return ws, user, nil
}

func readContent(user *auth.User, ws *websocket.Conn, name string, done chan<- int, content chan<- []byte) {
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
	if err := labelFilters(&filtersArgs, user, nil); err != nil {
		log.Printf(`[%s] Events opening in error: %v`, user.Username, err)
		return
	}
	if err := eventFilters(&filtersArgs); err != nil {
		log.Printf(`[%s] Events opening in error: %v`, user.Username, err)
		return
	}

	messages, errors := docker.Events(ctx, types.EventsOptions{Filters: filtersArgs})

	log.Printf(`[%s] Events streaming started`, user.Username)
	for {
		select {
		case <-ctx.Done():
			log.Printf(`[%s] Events streaming ended`, user.Username)
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

	log.Printf(`[%s] Logs streaming started for %s`, user.Username, containerID)
	scanner := bufio.NewScanner(logs)

	for scanner.Scan() {
		logLine := scanner.Bytes()
		if len(logLine) > ignoredByteLogSize {
			output <- append(logsPrefix, logLine[ignoredByteLogSize:]...)
		}
	}

	log.Printf(`[%s] Logs streaming ended for %s`, user.Username, containerID)
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
	log.Printf(`[%s] Stats streaming started for %s`, user.Username, containerID)

	for scanner.Scan() {
		output <- append(statsPrefix, scanner.Bytes()...)
	}

	log.Printf(`[%s] Stats streaming ended for %s`, user.Username, containerID)
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
		log.Printf(`[%s] Stopping %s stream`, user.Username, name)
		cancel()
	} else if action == start {
		log.Printf(`[%s] Starting %s stream`, user.Username, name)

		if cancel != nil {
			log.Printf(`[%s] Cancelling previous %s stream`, user.Username, name)
			cancel()
		}

		ctx, newCancel := context.WithCancel(context.Background())
		go streamFn(ctx, newCancel, user, string(containerID), output)

		return newCancel
	}

	return nil
}

func busWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	ws, user, err := upgradeAndAuth(w, r)
	if err != nil {
		log.Print(err)
		return
	}
	defer ws.Close()

	done := make(chan int)

	output := make(chan []byte)
	defer close(output)

	input := make(chan []byte)
	defer close(input)

	go readContent(user, ws, `streaming`, done, input)
	log.Printf(`[%s] Streaming started`, user.Username)

	var eventsCancelFunc context.CancelFunc
	var logsCancelFunc context.CancelFunc
	var statsCancelFunc context.CancelFunc

	output <- []byte(`ready`)

	for {
		select {
		case <-done:
			log.Printf(`[%s] Streaming ended`, user.Username)
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
type WebsocketHandler struct {
}

func (handler WebsocketHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	urlPath := []byte(r.URL.Path)

	if busWebsocketRequest.Match(urlPath) {
		busWebsocketHandler(w, r)
	}
}
