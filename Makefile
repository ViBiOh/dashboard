default: deps lint tst build

deps:
	go get -u github.com/golang/lint/golint
	go get -u github.com/docker/docker/api/types
	go get -u github.com/docker/docker/api/types/container
	go get -u github.com/docker/docker/api/types/filters
	go get -u github.com/docker/docker/api/types/network
	go get -u github.com/docker/docker/api/types/strslice
	go get -u github.com/docker/docker/api/types/swarm
	go get -u github.com/docker/docker/client
	go get -u github.com/gorilla/websocket
	go get -u golang.org/x/crypto/bcrypt
	go get -u gopkg.in/yaml.v2

lint:
	golint ./...
	go vet ./...

tst:
	script/coverage

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo dashboard.go
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bcrypt_pass bcrypt/bcrypt.go
