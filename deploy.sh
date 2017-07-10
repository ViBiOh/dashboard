#!/bin/bash

function readVariableIfRequired() {
  if [ -z "${!1}" ]; then
    read -p "${1}=" $1
  else
    echo "${1}="${!1}
  fi
}

function docker-clean() {
  imagesToClean=`docker images --filter dangling=true -q 2>/dev/null`

  if [ ! -z "${imagesToClean}" ]; then
    docker rmi ${imagesToClean} 
  fi
}

function docker-compose-hot-deploy() {
  PROJECT_NAME=${1}
  readVariableIfRequired "PROJECT_NAME"

  DOMAIN=${2}
  readVariableIfRequired "DOMAIN"
  export DOMAIN=${DOMAIN}

  PROJECT_FULLNAME=${PROJECT_NAME}_`git rev-parse --short HEAD`

  oldServices=`docker ps -f name=${PROJECT_NAME}_* -q ps`

  docker-compose -p ${PROJECT_FULLNAME} up -d
  servicesCount=`docker-compose -p ${PROJECT_FULLNAME} ps | awk '{if (NR > 2) {print $1}}' | wc -l`

  echo "Waiting 2 minutes for containers to start..."
  timeout=`date --date="2 minutes" +%s`
  healthyCount=$(docker events --until ${timeout} -f event="health_status: healthy" -f name=${PROJECT_NAME}_ | wc -l)

  if [ "${servicesCount}" != "${healthyCount}" ]; then
    docker-compose -p ${PROJECT_FULLNAME} stop
    docker-compose -p ${PROJECT_FULLNAME} rm

    return 1
  fi

  if [ ! -z "${services}" ]; then
    docker stop ${services}
  fi

  if [ ! -z "${services}" ]; then
    docker rm -f -v ${services}
  fi
  
  docker-clean
}

export PATH=${PATH}:/opt/bin

PROJECT_NAME=${1}
readVariableIfRequired "PROJECT_NAME"

PROJECT_URL=${2}
readVariableIfRequired "PROJECT_URL"

rm -rf ${PROJECT_NAME}
git clone ${PROJECT_URL} ${PROJECT_NAME}
cd ${PROJECT_NAME}

echo "Deploying stack for ${PROJECT_NAME}"
docker-compose-hot-deploy ${PROJECT_FULLNAME} ${3}
