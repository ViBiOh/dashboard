package docker

import (
	"context"
	"github.com/docker/docker/api/types"
	"github.com/gorilla/websocket"
	"io"
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
		log.Print(r.Host)
		return hostCheck.MatchString(r.Host)
	},
}

func logsContainerWebsocketHandler(w http.ResponseWriter, r *http.Request, containerID []byte) {
	logs, err := docker.ContainerLogs(context.Background(), string(containerID), types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: true})
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

	socketWrite, err := ws.NextWriter(websocket.BinaryMessage)
	if err != nil {
		log.Print(err)
		return
	}

	if _, err := io.Copy(socketWrite, logs); err != nil {
		log.Print(err)
	}
}

func handleWebsocket(w http.ResponseWriter, r *http.Request) {
	urlPath := []byte(r.URL.Path)

	if logWebsocketRequest.Match(urlPath) {
		logsContainerWebsocketHandler(w, r, logWebsocketRequest.FindSubmatch(urlPath)[1])
	}
}
