#!/usr/bin/env bash

set -e

echo Starting Dashboard with local configuration
export ADMIN_PASSWORD=`bcrypt admin`
./bin/compose -auth -traefik=false -prometheus=false -github=false -selenium=true -domain=:1080 -users=admin:admin > docker-compose.e2e.yml
docker-compose -p dashboard -f docker-compose.e2e.yml up -d

set +e

echo Running e2e tests
npm run test:e2e
result=$?

set -e

if [ "${result}" != "0" ]; then
    echo Checking logs on failure
    docker-compose -p dashboard -f docker-compose.e2e.yml logs
fi

echo Stopping started containers
docker-compose -p dashboard -f docker-compose.e2e.yml stop

exit $result