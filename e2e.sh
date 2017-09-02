#!/usr/bin/env bash

set -e

echo Starting Dashboard with local configuration
export GIT_COMMIT=`git log --pretty=format:'%h' -n 1`
docker-compose -p dashboard -f docker-compose-local.yml up -d

echo Checking everything started fine
sleep 5
docker ps -a
docker-compose -p dashboard -f docker-compose-local.yml logs

echo Running e2e tests
npm run test:e2e

echo Stopping started containers
docker-compose -p dashboard -f docker-compose-local.yml stop
