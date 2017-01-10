package docker

import (
	"context"
	"github.com/docker/docker/api/types"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func logsContainerWebsocketHandler(w http.ResponseWriter, r *http.Request, containerID []byte) {
	attach, err := docker.ContainerAttach(context.Background(), string(containerID), types.ContainerAttachOptions{Stream: true, Logs: true})
	if err != nil {
		errorHandler(w, err)
		return
	}

	defer attach.Close()

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print(err)
		return
	}

	defer ws.Close()

	for {
		data, err := attach.Reader.ReadString(13)
		if err != nil {
			log.Print(err)
		}
		ws.WriteMessage(websocket.TextMessage, []byte(data))
	}
}
