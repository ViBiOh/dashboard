package docker

import (
	"bufio"
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"regexp"
)

const ignoredByteLogSize = 8
const tailSize = `100`

var logWebsocketRequest = regexp.MustCompile(`containers/([^/]+)/logs`)
var eventsWebsocketRequest = regexp.MustCompile(`events`)
var hostCheck = regexp.MustCompile(`vibioh\.fr$`)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return hostCheck.MatchString(r.Host)
	},
}

func upgradeAndAuth(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print(err)
		defer ws.Close()
		return nil, err
	}

	_, basicAuth, err := ws.ReadMessage()
	if err != nil {
		log.Print(err)
		defer ws.Close()
		return nil, err
	}

	if _, err := isAuthenticatedByBasicAuth(string(basicAuth)); err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(err.Error()))
		defer ws.Close()
		return nil, err
	}

	return ws, nil
}

func logsContainerWebsocketHandler(w http.ResponseWriter, r *http.Request, containerID []byte) {
	ws, err := upgradeAndAuth(w, r)
	if err != nil {
		return
	}
	defer ws.Close()

	logs, err := docker.ContainerLogs(context.Background(), string(containerID), types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: true, Tail: tailSize})
	if err != nil {
		log.Print(err)
		return
	}

	defer logs.Close()

	go func() {
		scanner := bufio.NewScanner(logs)
		for scanner.Scan() {
			logLine := scanner.Bytes()
			if len(logLine) > ignoredByteLogSize {
				if err = ws.WriteMessage(websocket.TextMessage, logLine[ignoredByteLogSize:]); err != nil {
					log.Print(err)
					return
				}
			}
		}
	}()

	for {
		if _, _, err := ws.NextReader(); err != nil {
			return
		}
	}
}

func eventsWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	ws, err := upgradeAndAuth(w, r)
	if err != nil {
		return
	}
	defer ws.Close()

	context := context.Background()
	messages, errors := docker.Events(context, types.EventsOptions{})
	defer context.Done()

	go func() {
		for {
			select {
			case message := <-messages:
				log.Print(message)
				break
			case err := <-errors:
				log.Print(err)
				return
			}
		}
	}()

	for {
		if _, _, err := ws.NextReader(); err != nil {
			return
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
	}
}
