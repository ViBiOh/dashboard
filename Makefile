VERSION ?= $(shell git log --pretty=format:'%h' -n 1)
APP_NAME = dashboard

default: api

api: deps go docker-api

go: format lint tst bench build

version:
	@echo -n $(VERSION)

deps:
	go get -u github.com/golang/dep/cmd/dep
	go get -u github.com/golang/lint/golint
	go get -u github.com/kisielk/errcheck
	go get -u golang.org/x/tools/cmd/goimports
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

docker-deps:
	curl -s -o cacert.pem https://curl.haxx.se/ca/cacert.pem

docker-login:
	echo $(DOCKER_PASS) | docker login -u $(DOCKER_USER) --password-stdin

docker-promote: docker-promote-api docker-promote-ui

docker-push: docker-push-api docker-push-ui

docker-delete: docker-delete-api docker-delete-ui

docker-api: docker-build-api docker-push-api

docker-ui: docker-build-ui docker-push-ui

docker-build-api: docker-deps
	docker run -it --rm -v `pwd`/doc:/doc bukalapak/snowboard html -o api.html api.apib
	docker build -t $(DOCKER_USER)/dashboard-api:$(VERSION) .

docker-push-api: docker-login
	docker push $(DOCKER_USER)/$(APP_NAME)-api:$(VERSION)

docker-promote-api:
	docker tag $(DOCKER_USER)/$(APP_NAME)-api:$(VERSION) $(DOCKER_USER)/$(APP_NAME)-api:latest

docker-delete-api:
	curl -X DELETE -u "$(DOCKER_USER):$(DOCKER_CLOUD_TOKEN)" "https://cloud.docker.com/v2/repositories/$(DOCKER_USER)/$(APP_NAME)-api/tags/$(VERSION)/"

docker-build-ui: docker-deps
	docker build -t $(DOCKER_USER)/$(APP_NAME)-ui:$(VERSION) -f ui/Dockerfile ./ui/

docker-push-ui: docker-login
	docker push $(DOCKER_USER)/$(APP_NAME)-ui:$(VERSION)

docker-promote-ui:
	docker tag $(DOCKER_USER)/$(APP_NAME)-ui:$(VERSION) $(DOCKER_USER)/$(APP_NAME)-ui:latest

docker-delete-ui:
	curl -X DELETE -u "$(DOCKER_USER):$(DOCKER_CLOUD_TOKEN)" "https://cloud.docker.com/v2/repositories/$(DOCKER_USER)/$(APP_NAME)-ui/tags/$(VERSION)/"

start-deps:
	go get -u github.com/ViBiOh/auth/cmd/auth
	go get -u github.com/ViBiOh/auth/cmd/bcrypt
	go get -u github.com/ViBiOh/viws/cmd

start-auth:
	auth \
		-tls=false \
		-basicUsers "1:admin:`bcrypt admin`" \
		-corsHeaders Content-Type,Authorization \
		-port 1081 \
		-corsCredentials

start-api:
	go run cmd/dashboard/dashboard.go \
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

.PHONY: api go version deps format lint tst bench build docker-deps docker-login docker-promote docker-push dockere-delete docker-api docker-ui docker-build-api docker-push-api docker-promote-api dockere-delete-api docker-build-ui docker-push-ui docker-promote-ui dockere-delete-ui start-deps start-auth start-api start-front
