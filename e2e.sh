#!/usr/bin/env bash

set -e
set -u

export PROJECT_NAME='dashboard'

function renameComposeContainer() {
  local serviceNum=1
  for container in `docker-compose -p "${PROJECT_NAME}" -f docker-compose.yml ps -q`; do
      local serviceName=`docker-compose -p "${PROJECT_NAME}" -f docker-compose.yml ps --services | sed "${serviceNum}q;d"`
      docker rename "${container}" "${PROJECT_NAME}_${serviceName}"
      ((serviceNum++))
  done
}

echo Starting Dashboard with local configuration

go run cmd/compose/compose.go \
  -authBasic \
  -domain=:1080 \
  -environment="e2e" \
  -github=false \
  -mailer=false \
  -selenium=true \
  -tls=false \
  -tracing=false \
  -rollbar=false \
  -traefik=false \
  -version=`git log --pretty=format:'%h' -n 1` \
  > docker-compose.yml

go get github.com/ViBiOh/auth/cmd/bcrypt
export ADMIN_PASSWORD=`bcrypt admin`

docker-compose -p "${PROJECT_NAME}" -f docker-compose.yml up -d
renameComposeContainer

set +e

echo Running e2e tests

docker run \
  -it \
  --rm \
  --network "${PROJECT_NAME}_default" \
  --link "${PROJECT_NAME}_selenium":selenium \
  -v `pwd`/e2e:/tests codeception/codeceptjs \
  codeceptjs run-multiple --all
result=$?

set -e

if [ "${result}" != "0" ]; then
    echo Checking logs on failure
    docker-compose -p "${PROJECT_NAME}" -f docker-compose.yml logs
fi

echo Stopping started containers
docker-compose -p "${PROJECT_NAME}" -f docker-compose.yml stop
docker-compose -p "${PROJECT_NAME}" -f docker-compose.yml rm -f -v

exit $result
