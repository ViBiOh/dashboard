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
	logs, err := docker.ContainerLogs(context.Background(), string(containerID), types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true})
	if err != nil {
		log.Print(err)
		return
	}

	defer logs.Close()

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print(err)
		return
	}

	defer ws.Close()

	scanner := bufio.NewScanner(logs)

	for scanner.Scan() {
		line := scanner.Bytes()
		log.Print(string(line[8:]))

		if err = ws.WriteMessage(websocket.TextMessage, line[8:]); err != nil {
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
