#!/usr/bin/env bash

set -e

echo Starting Dashboard with local configuration
export GIT_COMMIT=`git log --pretty=format:'%h' -n 1`
docker-compose -p dashboard -f docker-compose.e2e.yml up -d

echo Checking everything started fine
docker-compose -p dashboard -f docker-compose.e2e.yml logs

set +e

echo Running e2e tests
npm run test:e2e

echo Checking running logs
docker-compose -p dashboard -f docker-compose.e2e.yml logs

set -e

echo Stopping started containers
docker-compose -p dashboard -f docker-compose.e2e.yml stop

exit $result