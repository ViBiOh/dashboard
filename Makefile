MAKEFLAGS += --silent
GOBIN=bin
BINARY_PATH=$(GOBIN)/$(APP_NAME)
VERSION ?= $(shell git log --pretty=format:'%h' -n 1)
AUTHOR ?= $(shell git log --pretty=format:'%an' -n 1)

APP_NAME ?= dashboard

help: Makefile
	@sed -n 's|^##||p' $< | column -t -s ':' | sed -e 's|^| |'

## $(APP_NAME)-api: Build app API with dependencies download
$(APP_NAME)-api: deps go

## $(APP_NAME)-ui: Build app UI with dependencies download
$(APP_NAME)-ui: build-ui

go: format lint tst bench build-api

## name: Output name of app
name:
	@echo -n $(APP_NAME)

## dist: Output build output path
dist:
	@echo -n $(BINARY_PATH)

## version: Output sha1 of last commit
version:
	@echo -n $(VERSION)

## author: Output author's name of last commit
author:
	@python -c 'import sys; import urllib; sys.stdout.write(urllib.quote_plus(sys.argv[1]))' "$(AUTHOR)"

## deps: Download dependencies
deps:
	go get github.com/golang/dep/cmd/dep
	go get github.com/golang/lint/golint
	go get github.com/kisielk/errcheck
	go get golang.org/x/tools/cmd/goimports
	dep ensure

## format: Format code of app
format:
	goimports -w */*/*.go
	gofmt -s -w */*/*.go

## lint: Lint code of app
lint:
	golint `go list ./... | grep -v vendor`
	errcheck -ignoretests `go list ./... | grep -v vendor`
	go vet ./...

## tst: Test code of app with coverage
tst:
	script/coverage

## bench: Benchmark code of app
bench:
	go test ./... -bench . -benchmem -run Benchmark.*

## build-api: Build binary of app
build-api:
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o $(BINARY_PATH) cmd/dashboard/dashboard.go
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/compose cmd/compose/compose.go

## doc: Build doc of app
doc:
	docker run -it --rm -v `pwd`/doc:/doc bukalapak/snowboard html -o api.html api.apib

## build-ui: Build bundle of app
build-ui:
	npm ci
	npm run build

start-deps:
	go get github.com/ViBiOh/auth/cmd/auth
	go get github.com/ViBiOh/auth/cmd/bcrypt
	go get github.com/ViBiOh/viws/cmd

## start-auth: Start authentification server
start-auth:
	auth \
		-tls=false \
		-basicUsers "1:admin:`bcrypt admin`" \
		-corsHeaders Content-Type,Authorization \
		-port 1081 \
		-corsCredentials

## start-front: Start frontend server
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
		-directory `pwd`/ui/dist

## start: Start app
start:
	go run -race cmd/dashboard/dashboard.go \
		-tls=false \
		-dockerWs ".*" \
		-dockerVersion '1.32' \
		-authUrl http://localhost:1081 \
		-authUsers admin:admin \
		-corsHeaders Content-Type,Authorization \
		-corsMethods GET,POST,DELETE \
		-corsCredentials \
		-csp "default-src 'self'; script-src 'unsafe-inline' ajax.googleapis.com cdnjs.cloudflare.com; style-src 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; font-src data: fonts.gstatic.com cdnjs.cloudflare.com; img-src data:" \
		-port 1082

.PHONY: help $(APP_NAME)-api $(APP_NAME)-ui go name dist version author deps format lint tst bench build-api build-ui doc start-deps start-auth start-front start
