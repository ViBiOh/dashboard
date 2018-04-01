#!/usr/bin/env bash

set -e

echo Starting Dashboard with local configuration

go run cmd/compose/compose.go \
  -tls=false \
  -authBasic \
  -traefik=false \
  -github=false \
  -selenium=true \
  -domain=:1080 \
  -version=`git log --pretty=format:'%h' -n 1` > docker-compose.yml

go get -u github.com/ViBiOh/auth/bcrypt
export ADMIN_PASSWORD=`bcrypt admin`
docker-compose -p dashboard -f docker-compose.yml up -d

set +e

echo Running e2e tests

docker run \
  -it \
  --rm \
  --network dashboard_default \
  --link dashboard_selenium_1:selenium \
  -v `pwd`/e2e:/tests codeception/codeceptjs \
  codeceptjs run-multiple --all
result=$?

set -e

if [ "${result}" != "0" ]; then
    echo Checking logs on failure
    docker-compose -p dashboard -f docker-compose.yml logs
fi

echo Stopping started containers
docker-compose -p dashboard -f docker-compose.yml stop
docker-compose -p dashboard -f docker-compose.yml rm -f -v

exit $result
