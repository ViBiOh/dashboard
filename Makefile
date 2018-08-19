APP_NAME = dashboard
VERSION ?= $(shell git log --pretty=format:'%h' -n 1)
AUTHOR ?= $(shell git log --pretty=format:'%an' -n 1)

docker: doc
	docker build -t vibioh/$(APP_NAME)-api:$(VERSION) .

docker-ui:
	docker build -t vibioh/$(APP_NAME)-ui:$(VERSION) -f Dockerfile_ui ./

$(APP_NAME): deps go

go: format lint tst bench build

name:
	@echo -n $(APP_NAME)

version:
	@echo -n $(VERSION)

author:
	@python -c 'import sys; import urllib; sys.stdout.write(urllib.quote_plus(sys.argv[1]))' "$(AUTHOR)"

deps:
	go get github.com/golang/dep/cmd/dep
	go get github.com/golang/lint/golint
	go get github.com/kisielk/errcheck
	go get golang.org/x/tools/cmd/goimports
	dep ensure

format:
	goimports -w */*/*.go
	gofmt -s -w */*/*.go

lint:
	golint `go list ./... | grep -v vendor`
	errcheck -ignoretests `go list ./... | grep -v vendor`
	go vet ./...

tst:
	script/coverage

bench:
	go test ./... -bench . -benchmem -run Benchmark.*

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/dashboard cmd/dashboard/dashboard.go
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/compose cmd/compose/compose.go

doc:
	docker run -it --rm -v `pwd`/doc:/doc bukalapak/snowboard html -o api.html api.apib

ui:
	npm install
	npm run build

start-deps:
	go get github.com/ViBiOh/auth/cmd/auth
	go get github.com/ViBiOh/auth/cmd/bcrypt
	go get github.com/ViBiOh/viws/cmd

start-auth:
	auth \
		-tls=false \
		-basicUsers "1:admin:`bcrypt admin`" \
		-corsHeaders Content-Type,Authorization \
		-port 1081 \
		-corsCredentials

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

.PHONY: docker docker-ui $(APP_NAME) go name version author deps format lint tst bench build doc start-deps start-auth start-front start
