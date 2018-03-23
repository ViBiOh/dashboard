SHELL := /bin/bash
DOCKER_VERSION ?= $(shell git log --pretty=format:'%h' -n 1)

default: go docker

go: deps dev

docker: docker-build docker-push

dev: format lint tst bench build

deps:
	go get -u github.com/golang/dep/cmd/dep
	go get -u github.com/golang/lint/golint
	go get -u github.com/kisielk/errcheck
	go get -u golang.org/x/tools/cmd/goimports
	dep ensure

format:
	goimports -w **/*.go *.go
	gofmt -s -w **/*.go *.go

lint:
	golint `go list ./... | grep -v vendor`
	errcheck -ignoretests `go list ./... | grep -v vendor`
	go vet ./...

tst:
	script/coverage

bench:
	go test ./... -bench . -benchmem -run Benchmark.*

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/dashboard dashboard.go
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/compose tools/compose.go

docker-deps:
	curl -s -o cacert.pem https://curl.haxx.se/ca/cacert.pem
	./blueprint.sh

docker-build: docker-deps docker-build-api docker-build-ui

docker-login:
	docker login -u $(DOCKER_USER) -p ${DOCKER_PASS}

docker-push: docker-push-api docker-push-ui

docker-promote: docker-promote-api docker-promote-ui

docker-build-api:
	docker build -t $(DOCKER_USER)/dashboard-api:$(DOCKER_VERSION) .

docker-push-api: docker-login
	docker push $(DOCKER_USER)/dashboard-api:$(DOCKER_VERSION)

docker-promote-api:
	docker tag $(DOCKER_USER)/dashboard-api:$(DOCKER_VERSION) $(DOCKER_USER)/dashboard-api:latest

docker-build-ui:
	docker build -t $(DOCKER_USER)/dashboard-front:$(DOCKER_VERSION) -f app/Dockerfile .

docker-push-ui: docker-login
	docker push $(DOCKER_USER)/dashboard-front:$(DOCKER_VERSION)

docker-promote-ui:
	docker tag $(DOCKER_USER)/dashboard-front:$(DOCKER_VERSION) $(DOCKER_USER)/dashboard-front:latest

start-deps:
	go get -u github.com/ViBiOh/auth
	go get -u github.com/ViBiOh/auth/bcrypt
	go get -u github.com/ViBiOh/viws

start-auth:
	auth \
		-tls=false \
		-basicUsers "1:admin:`bcrypt admin`" \
		-corsHeaders Content-Type,Authorization \
		-port 1081 \
		-corsCredentials

start-api:
	go run dashboard.go \
		-tls=false \
		-ws ".*" \
		-dockerVersion '1.32' \
		-authUrl http://localhost:1081 \
		-authUsers admin:admin \
		-corsHeaders Content-Type,Authorization \
		-corsMethods GET,POST,DELETE \
		-corsCredentials \
		-csp "default-src 'self'; script-src 'unsafe-inline' ajax.googleapis.com cdnjs.cloudflare.com; style-src 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; font-src data: fonts.gstatic.com cdnjs.cloudflare.com; img-src data:" \
		-port 1082

start-front:
	API_URL=http://localhost:1082 \
	WS_URL=ws://localhost:1082/ws \
	AUTH_URL=http://localhost:1081 \
	BASIC_AUTH_ENABLED=true \
	viws \
		-tls=false \
		-spa \
		-env API_URL,WS_URL,AUTH_URL,BASIC_AUTH_ENABLED \
		-csp "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: localhost:1081 localhost:1082;" \
		-directory `pwd`/dist
