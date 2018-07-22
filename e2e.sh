#!/usr/bin/env bash

set -e
set -u

echo Starting Dashboard with local configuration

go run cmd/compose/compose.go \
  -authBasic \
  -domain=:1080 \
  -environment "e2e" \
  -github=false \
  -mailer=false \
  -selenium=true \
  -tls=false \
  -tracing=false \
  -traefik=false \
  -version=`git log --pretty=format:'%h' -n 1` \
  > docker-compose.yml

go get github.com/ViBiOh/auth/cmd/bcrypt
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
