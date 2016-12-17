default: lint vet tst build

lint:
	go get -u github.com/golang/lint/golint
	golint ./...

vet:
	go vet ./...

tst:
	go test ./...

build:
	go get -u github.com/docker/docker/api/types
	go get -u github.com/docker/docker/client
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo server.go
