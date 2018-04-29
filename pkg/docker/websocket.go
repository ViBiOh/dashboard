package docker

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/gorilla/websocket"
)

const (
	ignoredByteLogSize = 8
	tailSize           = `100`
	start              = `start`
	stop               = `stop`
	busPrefix          = `/bus`
)

var (
	eventsDemand = regexp.MustCompile(`^events (\S+)`)
	logsDemand   = regexp.MustCompile(`^logs (\S+)(?: (.+))?`)
	statsDemand  = regexp.MustCompile(`^stats (\S+)(?: (.+))?`)
)

var (
	eventsPrefix = []byte(`events `)
	logsPrefix   = []byte(`logs `)
	statsPrefix  = []byte(`stats `)
)

func (a *App) upgradeAndAuth(w http.ResponseWriter, r *http.Request) (ws *websocket.Conn, user *model.User, err error) {
	ws, err = a.wsUpgrader.Upgrade(w, r, nil)

	defer func() {
		if err != nil && ws != nil {
			if closeErr := ws.Close(); closeErr != nil {
				err = fmt.Errorf(`%v, and also error while closing connection: %v`, err, closeErr)
			}
		}
	}()

	if err != nil {
		err = fmt.Errorf(`Error while upgrading connection: %v`, err)
		return
	}

	_, basicAuth, err := ws.ReadMessage()
	if err != nil {
		err = fmt.Errorf(`Error while reading authentification message: %v`, err)
		return
	}

	user, err = a.authApp.IsAuthenticatedByAuth(string(basicAuth))
	if err != nil {
		err = fmt.Errorf(`Error while checking authentification: %v`, err)
		if writeErr := ws.WriteMessage(websocket.TextMessage, []byte(err.Error())); writeErr != nil {
			err = fmt.Errorf(`%v, and also error while writing error message: %v`, err, writeErr)
		}
		return
	}

	return
}

func readContent(user *model.User, ws *websocket.Conn, name string, done chan<- struct{}, content chan<- []byte) {
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

func (a *App) streamEvents(ctx context.Context, cancel context.CancelFunc, user *model.User, _ string, output chan<- []byte) {
	defer cancel()

	filtersArgs := filters.NewArgs()
	labelFilters(user, &filtersArgs, ``)
	eventFilters(&filtersArgs)

	messages, errors := a.docker.Events(ctx, types.EventsOptions{Filters: filtersArgs})

	for {
		select {
		case <-ctx.Done():
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

func (a *App) streamLogs(ctx context.Context, cancel context.CancelFunc, user *model.User, containerID string, output chan<- []byte) {
	logs, err := a.docker.ContainerLogs(ctx, containerID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: true, Tail: tailSize})
	defer cancel()

	if logs != nil {
		defer func() {
			if err := logs.Close(); err != nil {
				log.Printf(`[%s] Error while closing logs for %s: %v`, user.Username, containerID, err)
			}
		}()
	}
	if err != nil {
		log.Printf(`[%s] Error while opening logs for %s: %v`, user.Username, containerID, err)
		return
	}

	scanner := bufio.NewScanner(logs)
	for scanner.Scan() {
		logLine := scanner.Bytes()
		if len(logLine) > ignoredByteLogSize {
			output <- append(logsPrefix, logLine[ignoredByteLogSize:]...)
		}
	}
}

func (a *App) streamStats(ctx context.Context, cancel context.CancelFunc, user *model.User, containerID string, output chan<- []byte) {
	stats, err := a.docker.ContainerStats(ctx, containerID, true)
	defer cancel()

	if err != nil {
		log.Printf(`[%s] Error while opening stats for %s: %v`, user.Username, containerID, err)
		return
	}
	defer func() {
		if err := stats.Body.Close(); err != nil {
			log.Printf(`[%s] Error while closing stats for %s: %v`, user.Username, containerID, err)
		}
	}()

	scanner := bufio.NewScanner(stats.Body)
	for scanner.Scan() {
		output <- append(statsPrefix, scanner.Bytes()...)
	}
}

func handleBusDemand(user *model.User, name string, input []byte, demand *regexp.Regexp, cancel context.CancelFunc, output chan<- []byte, streamFn func(context.Context, context.CancelFunc, *model.User, string, chan<- []byte)) context.CancelFunc {
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
		cancel()
	} else if action == start {
		if cancel != nil {
			cancel()
		}

		ctx, newCancel := context.WithCancel(context.Background())
		go streamFn(ctx, newCancel, user, string(containerID), output)

		return newCancel
	}

	return nil
}

func (a *App) busWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	ws, user, err := a.upgradeAndAuth(w, r)
	if err != nil {
		log.Printf(`Error while upgrading connection to websocket: %v`, err)
		return
	}
	defer func() {
		if err := ws.Close(); err != nil {
			log.Printf(`Error while closing connection to websocket: %v`, err)
		}
	}()

	done := make(chan struct{})

	output := make(chan []byte)
	defer close(output)

	input := make(chan []byte)
	defer close(input)

	go readContent(user, ws, `streaming`, done, input)

	var eventsCancelFunc context.CancelFunc
	var logsCancelFunc context.CancelFunc
	var statsCancelFunc context.CancelFunc

	if err = ws.WriteMessage(websocket.TextMessage, []byte(`ready`)); err != nil {
		log.Printf(`[%s] Error while saying ready: %v`, user.Username, err)
	}

	for {
		select {
		case <-done:
			return

		case inputBytes := <-input:
			if eventsDemand.Match(inputBytes) {
				eventsCancelFunc = handleBusDemand(user, `events`, inputBytes, eventsDemand, eventsCancelFunc, output, a.streamEvents)
				if eventsCancelFunc != nil {
					defer eventsCancelFunc()
				}
			} else if logsDemand.Match(inputBytes) {
				logsCancelFunc = handleBusDemand(user, `logs`, inputBytes, logsDemand, logsCancelFunc, output, a.streamLogs)
				if logsCancelFunc != nil {
					defer logsCancelFunc()
				}
			} else if statsDemand.Match(inputBytes) {
				statsCancelFunc = handleBusDemand(user, `stats`, inputBytes, statsDemand, statsCancelFunc, output, a.streamStats)
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
func (a *App) WebsocketHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, busPrefix) {
			a.busWebsocketHandler(w, r)
		}
	})
}
