package stream

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/ViBiOh/auth/pkg/auth"
	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/dashboard/pkg/commons"
	"github.com/ViBiOh/dashboard/pkg/docker"
	"github.com/ViBiOh/httputils/pkg/errors"
	"github.com/ViBiOh/httputils/pkg/logger"
	"github.com/ViBiOh/httputils/pkg/tools"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/gorilla/websocket"
)

const (
	tailSize  = "100"
	start     = "start"
	stop      = "stop"
	busPrefix = "/bus"
)

var (
	eventsDemand = regexp.MustCompile(`^events (\S+)`)
	logsDemand   = regexp.MustCompile(`^logs (\S+)(?: (.+))?`)
	statsDemand  = regexp.MustCompile(`^stats (\S+)(?: (.+))?`)
)

var (
	eventsPrefix = []byte("events ")
	logsPrefix   = []byte("logs ")
	statsPrefix  = []byte("stats ")
)

// Config of package
type Config struct {
	websocketOrigin *string
}

// App of package
type App struct {
	authApp    *auth.App
	dockerApp  *docker.App
	wsUpgrader websocket.Upgrader
}

// Flags adds flags for configuring package
func Flags(fs *flag.FlagSet, prefix string) Config {
	return Config{
		websocketOrigin: fs.String(tools.ToCamel(fmt.Sprintf("%sWs", prefix)), "^dashboard", "[stream] Allowed WebSocket Origin pattern"),
	}
}

// New creates new App from Config
func New(config Config, authApp *auth.App, dockerApp *docker.App) (*App, error) {
	hostCheck, err := regexp.Compile(*config.websocketOrigin)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return &App{
		authApp:   authApp,
		dockerApp: dockerApp,
		wsUpgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return hostCheck.MatchString(r.Host)
			},
		},
	}, nil
}

func (a *App) upgradeAndAuth(w http.ResponseWriter, r *http.Request) (ws *websocket.Conn, user *model.User, err error) {
	ws, err = a.wsUpgrader.Upgrade(w, r, nil)

	defer func() {
		if err != nil && ws != nil {
			if closeErr := ws.Close(); closeErr != nil && websocket.IsUnexpectedCloseError(closeErr, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
				err = errors.New("%v and also %v", err, closeErr)
			}
		}
	}()

	if err != nil {
		err = errors.WithStack(err)
		return
	}

	_, basicAuth, err := ws.ReadMessage()
	if err != nil {
		err = errors.WithStack(err)
		return
	}

	ctx, cancel := commons.GetCtx(r.Context())
	defer cancel()

	user, err = a.authApp.IsAuthenticatedByAuth(ctx, string(basicAuth))
	if err != nil {
		if writeErr := ws.WriteMessage(websocket.TextMessage, []byte(err.Error())); writeErr != nil {
			err = errors.New("%v and also %v", err, writeErr)
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
			if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
				logger.Error("%+v", errors.WithStack(err))
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
	docker.LabelFilters(user, &filtersArgs, "")
	commons.EventFilters(&filtersArgs)

	messages, errs := a.dockerApp.Docker.Events(ctx, types.EventsOptions{Filters: filtersArgs})

	for {
		select {
		case <-ctx.Done():
			return

		case message := <-messages:
			messageJSON, err := json.Marshal(message)
			if err != nil {
				logger.Error("%+v", errors.WithStack(err))
				cancel()
			} else {
				output <- append(eventsPrefix, messageJSON...)
			}

		case err := <-errs:
			if err != nil {
				logger.Error("%+v", errors.WithStack(err))
			}
			cancel()
		}
	}
}

func (a *App) streamLogs(ctx context.Context, cancel context.CancelFunc, user *model.User, containerID string, output chan<- []byte) {
	logs, err := a.dockerApp.Docker.ContainerLogs(ctx, containerID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: true, Tail: tailSize})
	defer cancel()

	if logs != nil {
		defer func() {
			if err := logs.Close(); err != nil {
				logger.Error("%+v", errors.WithStack(err))
			}
		}()
	}

	if err != nil {
		logger.Error("%+v", errors.WithStack(err))
		return
	}

	scanner := bufio.NewScanner(logs)
	for scanner.Scan() {
		logLine := scanner.Bytes()
		if len(logLine) > commons.IgnoredByteLogSize {
			output <- append(logsPrefix, logLine[commons.IgnoredByteLogSize:]...)
		}
	}
}

func (a *App) streamStats(ctx context.Context, cancel context.CancelFunc, user *model.User, containerID string, output chan<- []byte) {
	stats, err := a.dockerApp.Docker.ContainerStats(ctx, containerID, true)
	defer cancel()

	if err != nil {
		logger.Error("%+v", errors.WithStack(err))
		return
	}

	defer func() {
		if err := stats.Body.Close(); err != nil {
			logger.Error("%+v", errors.WithStack(err))
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
		logger.Error("unable to parse bus demand %s for %s", input, name)
	}

	action := string(demandGroups[1])

	containerID := ""
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
		go streamFn(ctx, newCancel, user, containerID, output)

		return newCancel
	}

	return nil
}

func (a *App) busWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	ws, user, err := a.upgradeAndAuth(w, r)
	if err != nil {
		logger.Error("%+v", err)
		return
	}
	defer func() {
		if err := ws.Close(); err != nil && websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
			logger.Error("%+v", errors.WithStack(err))
		}
	}()

	done := make(chan struct{})

	output := make(chan []byte)
	defer close(output)

	input := make(chan []byte)
	defer close(input)

	go readContent(user, ws, "streaming", done, input)

	var eventsCancelFunc context.CancelFunc
	var logsCancelFunc context.CancelFunc
	var statsCancelFunc context.CancelFunc

	if err = ws.WriteMessage(websocket.TextMessage, []byte("ready")); err != nil {
		logger.Error("%+v", errors.WithStack(err))
	}

	for {
		select {
		case <-done:
			return

		case inputBytes := <-input:
			if eventsDemand.Match(inputBytes) {
				eventsCancelFunc = handleBusDemand(user, "events", inputBytes, eventsDemand, eventsCancelFunc, output, a.streamEvents)
				if eventsCancelFunc != nil {
					defer eventsCancelFunc()
				}
			} else if logsDemand.Match(inputBytes) {
				logsCancelFunc = handleBusDemand(user, "logs", inputBytes, logsDemand, logsCancelFunc, output, a.streamLogs)
				if logsCancelFunc != nil {
					defer logsCancelFunc()
				}
			} else if statsDemand.Match(inputBytes) {
				statsCancelFunc = handleBusDemand(user, "stats", inputBytes, statsDemand, statsCancelFunc, output, a.streamStats)
				if statsCancelFunc != nil {
					defer statsCancelFunc()
				}
			}

		case outputBytes := <-output:
			if err = ws.WriteMessage(websocket.TextMessage, outputBytes); err != nil {
				logger.Error("%+v", errors.WithStack(err))
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
