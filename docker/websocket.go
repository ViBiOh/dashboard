package docker

import (
	"bufio"
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"regexp"
)

const ignoredByteLogSize = 8
const tailSize = `100`

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

func upgradeAndAuth(w http.ResponseWriter, r *http.Request) (*websocket.Conn, *user, error) {
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

	loggedUser, err := isAuthenticatedByBasicAuth(string(basicAuth))
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(err.Error()))
		defer ws.Close()
		return nil, nil, err
	}

	return ws, loggedUser, nil
}

func logsContainerWebsocketHandler(w http.ResponseWriter, r *http.Request, containerID []byte) {
	ws, _, err := upgradeAndAuth(w, r)
	if err != nil {
		log.Print(err)
		return
	}
	defer ws.Close()

	context := context.Background()
	defer context.Done()

	logs, err := docker.ContainerLogs(context, string(containerID), types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: true, Tail: tailSize})
	if err != nil {
		log.Print(err)
		return
	}
	defer logs.Close()

	done := make(chan struct{})

	go func() {
		scanner := bufio.NewScanner(logs)
		for scanner.Scan() {
			select {
			case <-done:
				return

			default:
				logLine := scanner.Bytes()
				if len(logLine) > ignoredByteLogSize {
					if err = ws.WriteMessage(websocket.TextMessage, logLine[ignoredByteLogSize:]); err != nil {
						log.Printf(`Error while writing to logs socket: %v`, err)
						close(done)
						return
					}
				}
			}
		}
	}()

	for {
		select {
		case <-done:
			return

		default:
			if _, _, err := ws.NextReader(); err != nil {
				log.Printf(`Error while reading from logs socket: %v`, err)
				close(done)
				return
			}
		}
	}
}

func eventsWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	ws, loggedUser, err := upgradeAndAuth(w, r)
	if err != nil {
		return
	}
	defer ws.Close()

	filtersArgs := filters.NewArgs()
	if labelFilters(&filtersArgs, loggedUser, nil) != nil {
		log.Printf(`Error while defining label filters: %v`, err)
		return
	}
	if eventFilters(&filtersArgs) != nil {
		log.Printf(`Error while defining event filters: %v`, err)
		return
	}

	context := context.Background()
	defer context.Done()
	messages, errors := docker.Events(context, types.EventsOptions{Filters: filtersArgs})

	done := make(chan struct{})

	go func() {
		for {
			select {
			case <-done:
				return

			case message := <-messages:
				messageJSON, err := json.Marshal(message)
				if err != nil {
					log.Printf(`Error while marshalling event: %v`, err)
					close(done)
					return
				}

				if err = ws.WriteMessage(websocket.TextMessage, messageJSON); err != nil {
					log.Printf(`Error while writing to events socket: %v`, err)
					close(done)
					return
				}
				break

			case err := <-errors:
				log.Printf(`Error while reading events: %v`, err)
				close(done)
				return
			}
		}
	}()

	for {
		select {
		case <-done:
			return
		default:
			if _, _, err := ws.NextReader(); err != nil {
				log.Printf(`Error while reading from events socket: %v`, err)
				close(done)
				return
			}
		}
	}
}

func statsWebsocketHandler(w http.ResponseWriter, r *http.Request, containerID []byte) {
	ws, _, err := upgradeAndAuth(w, r)
	if err != nil {
		log.Print(err)
		return
	}
	defer ws.Close()

	context := context.Background()
	defer context.Done()

	stats, err := docker.ContainerStats(context, string(containerID), true)
	if err != nil {
		log.Print(err)
		return
	}
	defer stats.Body.Close()

	done := make(chan struct{})

	go func() {
		scanner := bufio.NewScanner(stats.Body)
		for scanner.Scan() {
			select {
			case <-done:
				return

			default:
				if err = ws.WriteMessage(websocket.TextMessage, scanner.Bytes()); err != nil {
					log.Printf(`Error while writing to stats socket: %v`, err)
					close(done)
					return
				}
			}
		}
	}()

	for {
		select {
		case <-done:
			return

		default:
			if _, _, err := ws.NextReader(); err != nil {
				log.Printf(`Error while reading from stats socket: %v`, err)
				close(done)
				return
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
	}
}
