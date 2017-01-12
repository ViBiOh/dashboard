package docker

import (
	"bufio"
	"context"
	"github.com/docker/docker/api/types"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"regexp"
)

const ignoredByteLogSize = 8

var logWebsocketRequest = regexp.MustCompile(`/containers/([^/]+)/logs`)
var hostCheck = regexp.MustCompile(`vibioh\.fr$`)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return hostCheck.MatchString(r.Host)
	},
}

func logsContainerWebsocketHandler(w http.ResponseWriter, r *http.Request, containerID []byte) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print(err)
		return
	}

	defer ws.Close()

	_, basicAuth, err := ws.ReadMessage()
	if err != nil {
		log.Print(err)
		return
	}

	if _, err := isAuthenticatedByBasicAuth(string(basicAuth)); err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte(err.Error()))
		return
	}

	logs, err := docker.ContainerLogs(context.Background(), string(containerID), types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: true})
	if err != nil {
		log.Print(err)
		return
	}

	defer logs.Close()

	scanner := bufio.NewScanner(logs)
	for scanner.Scan() {
		if err = ws.WriteMessage(websocket.TextMessage, scanner.Bytes()[ignoredByteLogSize:]); err != nil {
			log.Print(err)
			return
		}
	}
}

func handleWebsocket(w http.ResponseWriter, r *http.Request) {
	urlPath := []byte(r.URL.Path)

	if logWebsocketRequest.Match(urlPath) {
		logsContainerWebsocketHandler(w, r, logWebsocketRequest.FindSubmatch(urlPath)[1])
	}
}
