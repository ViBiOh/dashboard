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

var eventsDemand = regexp.MustCompile(`^events (.+)`)
var logsDemand = regexp.MustCompile(`^logs (.+) (.+)`)
var statsDemand = regexp.MustCompile(`^stats (.+) (.+)`)
var busWebsocketRequest = regexp.MustCompile(`bus`)
var logWebsocketRequest = regexp.MustCompile(`containers/([^/]+)/logs`)
var statsWebsocketRequest = regexp.MustCompile(`containers/([^/]+)/stats`)
var eventsWebsocketRequest = regexp.MustCompile(`events`)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return hostCheck.MatchString(r.Host)
	},
}

func readUntilClose(user *auth.User, ws *websocket.Conn, name string) bool {
	messageType, _, err := ws.ReadMessage()

	if messageType == websocket.CloseMessage {
		return true
	}

	if err != nil {
		if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived, websocket.CloseAbnormalClosure) {
			log.Printf(`[%s] Error while reading from %s socket: %v`, user.Username, name, err)
		}

		return true
	}

	return false
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

func logsContainerWebsocketHandler(w http.ResponseWriter, r *http.Request, containerID []byte) {
	ws, user, err := upgradeAndAuth(w, r)
	if err != nil {
		log.Print(err)
		return
	}
	defer ws.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logs, err := docker.ContainerLogs(ctx, string(containerID), types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: true, Tail: tailSize})
	if err != nil {
		log.Print(err)
		return
	}
	defer logs.Close()

	go func() {
		defer cancel()

		scanner := bufio.NewScanner(logs)
		for scanner.Scan() {
			select {
			case <-ctx.Done():
				return

			default:
				logLine := scanner.Bytes()
				if len(logLine) > ignoredByteLogSize {
					if err = ws.WriteMessage(websocket.TextMessage, logLine[ignoredByteLogSize:]); err != nil {
						log.Printf(`[%s] Error while writing to logs socket: %v`, user.Username, err)
						return
					}
				}
			}
		}
	}()

	for {
		select {
		case <-ctx.Done():
			break

		default:
			if readUntilClose(user, ws, `logs`) {
				return
			}
		}
	}
}

func eventsWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	ws, user, err := upgradeAndAuth(w, r)
	if err != nil {
		return
	}
	defer ws.Close()

	filtersArgs := filters.NewArgs()
	if labelFilters(&filtersArgs, user, nil) != nil {
		log.Printf(`[%s] Error while defining label filters: %v`, user.Username, err)
		return
	}
	if eventFilters(&filtersArgs) != nil {
		log.Printf(`[%s] Error while defining event filters: %v`, user.Username, err)
		return
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	messages, errors := docker.Events(ctx, types.EventsOptions{Filters: filtersArgs})

	go func() {
		defer cancel()

		for {
			select {
			case <-ctx.Done():
				return

			case message := <-messages:
				messageJSON, err := json.Marshal(message)
				if err != nil {
					log.Printf(`[%s] Error while marshalling event: %v`, user.Username, err)
					return
				}

				if err = ws.WriteMessage(websocket.TextMessage, messageJSON); err != nil {
					log.Printf(`[%s] Error while writing to events socket: %v`, user.Username, err)
					return
				}

			case err := <-errors:
				log.Printf(`[%s] Error while reading events: %v`, user.Username, err)
				return
			}
		}
	}()

	for {
		select {
		case <-ctx.Done():
			break

		default:
			if readUntilClose(user, ws, `events`) {
				return
			}
		}
	}
}

func statsWebsocketHandler(w http.ResponseWriter, r *http.Request, containerID []byte) {
	ws, user, err := upgradeAndAuth(w, r)
	if err != nil {
		log.Print(err)
		return
	}
	defer ws.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	stats, err := docker.ContainerStats(ctx, string(containerID), true)
	if err != nil {
		log.Print(err)
		return
	}
	defer stats.Body.Close()

	go func() {
		defer cancel()

		scanner := bufio.NewScanner(stats.Body)
		for scanner.Scan() {
			select {
			case <-ctx.Done():
				log.Printf(`[%s] Stats context is over for writing`, user.Username)
				return

			default:
				if err = ws.WriteMessage(websocket.TextMessage, scanner.Bytes()); err != nil {
					log.Printf(`[%s] Error while writing to stats socket: %v`, user.Username, err)
					return
				}
			}
		}
	}()

	for {
		select {
		case <-ctx.Done():
			log.Printf(`[%s] Stats context is over for reading`, user.Username)
			return

		default:
			if readUntilClose(user, ws, `stats`) {
				return
			}
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
	log.Printf(`[%s] Logs streaming started for %s`, user.Username, containerID)

	for scanner.Scan() {
		logLine := scanner.Bytes()
		if len(logLine) > ignoredByteLogSize {
			output <- logLine[ignoredByteLogSize:]
		}
	}

	log.Printf(`[%s] Logs streaming ended for %s`, user.Username, containerID)
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
				output <- messageJSON
			}

		case err := <-errors:
			log.Printf(`[%s] Events reading in error: %v`, user.Username, err)
			cancel()
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
	log.Printf(`[%s] Stats streaming started for %s`, user.Username, containerID)

	for scanner.Scan() {
		output <- scanner.Bytes()
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
		log.Printf(`[%s] Starting %s stream for %s`, user.Username, name, containerID)

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

	if logWebsocketRequest.Match(urlPath) {
		logsContainerWebsocketHandler(w, r, logWebsocketRequest.FindSubmatch(urlPath)[1])
	} else if eventsWebsocketRequest.Match((urlPath)) {
		eventsWebsocketHandler(w, r)
	} else if statsWebsocketRequest.Match(urlPath) {
		statsWebsocketHandler(w, r, statsWebsocketRequest.FindSubmatch(urlPath)[1])
	} else if busWebsocketRequest.Match(urlPath) {
		busWebsocketHandler(w, r)
	}
}
