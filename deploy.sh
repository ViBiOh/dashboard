#!/usr/bin/env bash

set -e

function readVariableIfRequired() {
  if [ -z "${!1}" ]; then
    read -p "${1}=" $1
  else
    echo "${1}="${!1}
  fi
}

function docker-compose-deploy() {
  PROJECT_NAME=${1}
  readVariableIfRequired "PROJECT_NAME"

  oldServices=`docker ps -f name=${PROJECT_NAME}* -q`

  PROJECT_FULLNAME=${PROJECT_NAME}`git rev-parse --short HEAD`

  docker-compose -p ${PROJECT_FULLNAME} config -q
  docker-compose -p ${PROJECT_FULLNAME} pull
  docker-compose -p ${PROJECT_FULLNAME} up -d
  servicesCount=`docker-compose -p ${PROJECT_FULLNAME} ps -q | wc -l`

  echo "Waiting 45 seconds for containers to start..."
  timeout=`date --date="45 seconds" +%s`
  healthyCount=$(docker events --until ${timeout} -f event="health_status: healthy" -f name=${PROJECT_FULLNAME} | wc -l)

#  if [ "${servicesCount}" != "${healthyCount}" ]; then
#    echo "Containers didn't start, reverting..."
#
#    docker-compose -p ${PROJECT_FULLNAME} logs || true
#    docker-compose -p ${PROJECT_FULLNAME} ps -q | xargs docker inspect --format='{{ .Name }}{{ "\n" }}{{range .State.Health.Log }}code={{ .ExitCode }}, log={{ .Output }}{{ end }}' || true
#    docker-compose -p ${PROJECT_FULLNAME} stop -t 180 || true
#    docker-compose -p ${PROJECT_FULLNAME} rm -f -v || true
#    return 1
#  fi

  if [ ! -z "${oldServices}" ]; then
    echo Stopping old containers
    docker stop -t 180 ${oldServices} || true
  fi

  if [ ! -z "${oldServices}" ]; then
    echo Removing old containers
    docker rm -f -v ${oldServices} || true
  fi

  echo Renaming containers
  docker-compose -p ${PROJECT_FULLNAME} ps -q | xargs docker inspect --format='{{ .Name }}' | sed "s|^/||" | awk "{o=\$1; gsub(\"${PROJECT_FULLNAME}\", \"${PROJECT_NAME}\", o); print \$0 \" \" o}" | xargs -n 2 docker rename

  echo Deploy succeed!
  
  docker system prune -f
}

export PATH=${PATH}:/opt/bin

PROJECT_NAME=${1}
readVariableIfRequired "PROJECT_NAME"

PROJECT_URL=${2}
readVariableIfRequired "PROJECT_URL"

rm -rf ${PROJECT_NAME}
git clone ${PROJECT_URL} ${PROJECT_NAME}
cd ${PROJECT_NAME}

echo "Deploying ${PROJECT_NAME}"
docker-compose-deploy ${PROJECT_NAME}
