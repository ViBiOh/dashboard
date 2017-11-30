default: go docker

go: deps dev

dev: format lint tst bench build

docker: docker-deps docker-build

deps:
	go get -u github.com/golang/dep/cmd/dep
	go get -u github.com/golang/lint/golint
	go get -u golang.org/x/tools/cmd/goimports
	dep ensure

format:
	goimports -w **/*.go *.go
	gofmt -s -w **/*.go *.go

lint:
	golint `go list ./... | grep -v vendor`
	go vet ./...

tst:
	script/coverage

bench:
	go test ./... -bench . -benchmem -run Benchmark.*

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/dashboard dashboard.go
	CGO_ENABLED=0 go build -ldflags="-s -w" -installsuffix nocgo -o bin/compose tools/compose.go

docker: docker-deps docker-build

docker-deps:
	curl -s -o cacert.pem https://curl.haxx.se/ca/cacert.pem
	./blueprint.sh

docker-build:
	docker build -t ${DOCKER_USER}/dashboard-front -f app/Dockerfile .
	docker build -t ${DOCKER_USER}/dashboard-api .

docker-push:
	docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}
	docker push ${DOCKER_USER}/dashboard-api
	docker push ${DOCKER_USER}/dashboard-front

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
	  -dockerVersion '1.24' \
	  -authUrl http://localhost:1081 \
	  -authUsers admin:admin \
	  -corsHeaders Content-Type,Authorization \
	  -corsMethods GET,POST,DELETE \
	  -corsCredentials \
	  -csp "default-src 'self'; script-src 'unsafe-inline' ajax.googleapis.com cdnjs.cloudflare.com; style-src 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; font-src data: fonts.gstatic.com cdnjs.cloudflare.com; img-src data:" \
	  -port 1082

start-front:
	API_URL=http://localhost:1082 WS_URL=ws://localhost:1082/ws AUTH_URL=http://localhost:1081 BASIC_AUTH_ENABLED=true viws \
	  -spa \
	  -env API_URL,WS_URL,AUTH_URL,BASIC_AUTH_ENABLED \
	  -csp "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: localhost:1081 localhost:1082;" \
	  -directory `pwd`/dist
