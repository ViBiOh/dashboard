SHELL = /bin/sh

APP_NAME ?= dashboard
VERSION ?= $(shell git rev-parse --short HEAD)
AUTHOR ?= $(shell git log --pretty=format:'%an' -n 1)
PACKAGES ?= ./...

APP_PACKAGES = $(shell go list -e $(PACKAGES) | grep -v vendor | grep -v node_modules)

GOBIN=bin
BINARY_PATH=$(GOBIN)/$(APP_NAME)

SERVER_SOURCE = cmd/dashboard/dashboard.go
SERVER_RUNNER = go run $(SERVER_SOURCE)
ifeq ($(DEBUG), true)
	SERVER_RUNNER = dlv debug $(SERVER_SOURCE) --
endif

## help: Display list of commands
.PHONY: help
help: Makefile
	@sed -n 's|^##||p' $< | column -t -s ':' | sed -e 's|^| |'

## $(APP_NAME)-api: Build app API with dependencies download
.PHONY: $(APP_NAME)-api
$(APP_NAME)-api: deps go

## $(APP_NAME)-ui: Build app UI with dependencies download
.PHONY: $(APP_NAME)-ui
$(APP_NAME)-ui: build-ui

## go: Build app
.PHONY: go
go: format lint tst bench build-api

## name: Output name
.PHONY: name
name:
	@echo -n $(APP_NAME)

## dist: Output build output path
.PHONY: dist
dist:
	@echo -n $(BINARY_PATH)

## version: Output sha1 of last commit
.PHONY: version
version:
	@echo -n $(VERSION)

## author: Output author's name of last commit
.PHONY: author
author:
	@python -c 'import sys; import urllib; sys.stdout.write(urllib.quote_plus(sys.argv[1]))' "$(AUTHOR)"

## deps: Download dependencies
.PHONY: deps
deps:
	go get github.com/golang/dep/cmd/dep
	go get github.com/kisielk/errcheck
	go get golang.org/x/lint/golint
	go get golang.org/x/tools/cmd/goimports
	dep ensure

## format: Format code
.PHONY: format
format:
	goimports -w */*/*.go
	gofmt -s -w */*/*.go

## lint: Lint code
.PHONY: lint
lint:
	golint $(APP_PACKAGES)
	errcheck -ignoretests $(APP_PACKAGES)
	go vet $(APP_PACKAGES)

## tst: Test code with coverage
.PHONY: tst
tst:
	script/coverage

## bench: Benchmark code
.PHONY: bench
bench:
	go test $(APP_PACKAGES) -bench . -benchmem -run Benchmark.*

## build-api: Build binary
.PHONY: build-api
build-api:
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o $(BINARY_PATH) cmd/dashboard/dashboard.go
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/compose cmd/compose/compose.go

## doc: Build doc
.PHONY: doc
doc:
	docker run -it --rm -v `pwd`/doc:/doc quay.io/bukalapak/snowboard html -o api.html api.apib

## build-ui: Build bundle
.PHONY: build-ui
build-ui:
	npm ci
	npm run build

## start-deps: Download start dependencies
.PHONY: start-deps
start-deps:
	go get github.com/ViBiOh/auth/cmd/auth
	go get github.com/ViBiOh/auth/cmd/bcrypt
	go get github.com/ViBiOh/viws/cmd/viws

## start-auth: Start authentification server
.PHONY: start-auth
start-auth:
	auth \
		-tls=false \
		-basicUsers "1:admin:`bcrypt admin`" \
		-corsHeaders Content-Type,Authorization \
		-port 1081 \
		-corsCredentials \
		-corsOrigin http://localhost:1080

## start-front: Start frontend server
.PHONY: start-front
start-front:
	API_URL=http://localhost:1082 \
	WS_URL=ws://localhost:1082/ws \
	AUTH_URL=http://localhost:1081 \
	BASIC_AUTH_ENABLED=true \
	ROLLBAR_TOKEN=$(ROLLBAR_TOKEN) \
	ENVIRONMENT=dev \
	viws \
		-tls=false \
		-spa \
		-env API_URL,WS_URL,AUTH_URL,BASIC_AUTH_ENABLED,GITHUB_AUTH_ENABLED,ENVIRONMENT,ROLLBAR_TOKEN \
		-csp "default-src 'self'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com/ajax/libs/rollbar.js/; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: localhost:1081 localhost:1082 api.rollbar.com" \
		-directory `pwd`/dist

## start: Start app
.PHONY: start
start:
	$(SERVER_RUNNER) \
		-tls=false \
		-dockerWs ".*" \
		-dockerVersion '1.32' \
		-authUrl http://localhost:1081 \
		-authUsers admin:admin \
		-corsHeaders Content-Type,Authorization \
		-corsMethods GET,POST,DELETE \
		-corsCredentials \
		-corsOrigin http://localhost:1080 \
		-csp "default-src 'self'; script-src 'unsafe-inline' ajax.googleapis.com cdnjs.cloudflare.com; style-src 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; font-src data: fonts.gstatic.com cdnjs.cloudflare.com; img-src data:" \
		-port 1082
