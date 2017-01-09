package docker

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// WsHandler for WebSocket request. Should be use with net/http
type WsHandler struct {
}

func (handler WsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	for {
		if messageType, p, err := conn.ReadMessage(); err != nil {
			log.Println(err)
		} else if string(p) == `close` {
			if err = conn.Close(); err != nil {
				log.Println(err)
			}
		} else if err = conn.WriteMessage(messageType, p); err != nil {
			log.Println(err)
		}
	}
}
