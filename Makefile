default: deps lint vet tst build

deps:
	go get -u github.com/golang/lint/golint
	go get -u github.com/docker/docker/api/types
	go get -u github.com/docker/docker/client

lint:
	golint ./...

vet:
	go vet ./...

tst:
	go test ./...

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo server.go
