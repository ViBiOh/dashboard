default: deps format lint tst build

deps:
	go get -u golang.org/x/tools/cmd/goimports
	go get -u github.com/golang/lint/golint
	go get -u github.com/docker/docker/client
	go get -u github.com/docker/docker/api/types
	go get -u github.com/docker/docker/api/types/container
	go get -u github.com/docker/docker/api/types/filters
	go get -u github.com/docker/docker/api/types/network
	go get -u github.com/docker/docker/api/types/strslice
	go get -u github.com/docker/docker/api/types/swarm
	go get -u github.com/ViBiOh/httputils
	go get -u github.com/ViBiOh/httputils/cert
	go get -u github.com/ViBiOh/httputils/cors
	go get -u github.com/ViBiOh/httputils/owasp
	go get -u github.com/ViBiOh/httputils/prometheus
	go get -u github.com/ViBiOh/alcotest/alcotest
	go get -u github.com/gorilla/websocket
	go get -u gopkg.in/yaml.v2
	npm install --ignore-scripts

format:
	goimports -w **/*.go *.go
	gofmt -s -w **/*.go *.go

lint:
	golint ./...
	go vet ./...

tst:
	script/coverage

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/dashboard dashboard.go

format-front:
	npm run format

lint-front:
	npm run lint

tst-front:
	npm test

build-front:
	npm run build

doc:
	npm run doc
