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
			messageType, _, err := ws.NextReader()
			if err != nil {
				log.Printf(`[%s] Error while reading from logs socket: %v`, user.Username, err)
				return
			}
			if messageType == websocket.CloseMessage {
				break
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
			messageType, _, err := ws.NextReader()
			if err != nil {
				log.Printf(`[%s] Error while reading from events socket: %v`, user.Username, err)
				return
			}
			if messageType == websocket.CloseMessage {
				break
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
			break

		default:
			messageType, _, err := ws.NextReader()
			if err != nil {
				log.Printf(`[%s] Error while reading from stats socket: %v`, user.Username, err)
				return
			}
			if messageType == websocket.CloseMessage {
				break
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
