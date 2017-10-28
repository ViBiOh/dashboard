default: deps format lint tst build

deps:
	go get -u github.com/docker/docker/api/types
	go get -u github.com/docker/docker/api/types/container
	go get -u github.com/docker/docker/api/types/filters
	go get -u github.com/docker/docker/api/types/network
	go get -u github.com/docker/docker/api/types/strslice
	go get -u github.com/docker/docker/api/types/swarm
	go get -u github.com/docker/docker/client
	go get -u github.com/golang/lint/golint
	go get -u github.com/gorilla/websocket
	go get -u github.com/NYTimes/gziphandler
	go get -u github.com/ViBiOh/alcotest/alcotest
	go get -u github.com/ViBiOh/httputils
	go get -u github.com/ViBiOh/httputils/cert
	go get -u github.com/ViBiOh/httputils/cors
	go get -u github.com/ViBiOh/httputils/owasp
	go get -u github.com/ViBiOh/httputils/prometheus
	go get -u github.com/ViBiOh/httputils/rate
	go get -u golang.org/x/tools/cmd/goimports
	go get -u gopkg.in/yaml.v2

format:
	goimports -w **/*.go *.go
	gofmt -s -w **/*.go *.go

lint:
	golint ./...
	go vet ./...

tst:
	script/coverage

bench:
	go test ./... -bench . -benchmem -run Benchmark.*

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/dashboard dashboard.go
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/compose tools/compose.go

deps-start:
	go get -u github.com/ViBiOh/auth
	go get -u github.com/ViBiOh/auth/bcrypt
	go get -u github.com/ViBiOh/viws

start-auth:
	auth -tls=false -basicUsers "admin:`bcrypt admin`" -corsHeaders Content-Type,Authorization -port 1081 -corsCredentials

start-api:
	go run dashboard.go -tls=false -ws ".*" -dockerVersion '1.24' -authUrl http://localhost:1081 -users admin:admin -corsHeaders Content-Type,Authorization -corsMethods GET,POST,DELETE -corsCredentials -csp "default-src 'self'; script-src 'unsafe-inline' ajax.googleapis.com cdnjs.cloudflare.com; style-src 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; font-src data: fonts.gstatic.com cdnjs.cloudflare.com; img-src data:" -port 1082

start-front:
	API_URL=http://localhost:1082 WS_URL=ws://localhost:1082/ws AUTH_URL=http://localhost:1081 BASIC_AUTH_ENABLED=true viws -spa -env API_URL,WS_URL,AUTH_URL,BASIC_AUTH_ENABLED -csp "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: localhost:1081 localhost:1082;" -directory `pwd`/dist
