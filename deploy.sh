#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

start_services() {
  if [[ "${#}" -ne 1 ]]; then
    echo "Usage: start_services [PROJECT_FULLNAME]"
    return 1
  fi

  docker-compose -p "${1}" config -q
  docker-compose -p "${1}" pull
  docker-compose -p "${1}" up -d
}

count_healthy_services() {
  if [[ "${#}" -ne 1 ]]; then
    echo "Usage: count_healthy_services [PROJECT_FULLNAME]"
    return 1
  fi

  local counter=0

  for service in $(docker-compose -p "${1}" ps --services); do
    local containerID=$(docker ps -q --filter name="${1}_${service}")

    if [[ $(docker inspect --format '{{ .State.Health }}' "${containerID}") != '<nil>' ]]; then
      counter=$((counter+1))
    fi
  done

  echo "${counter}"
}

revert_services() {
  if [[ "${#}" -ne 1 ]]; then
    echo "Usage: revert_services [PROJECT_FULLNAME]"
    return 1
  fi

  echo "Containers didn't start, reverting..."

  docker-compose -p "${1}" logs || true

  for service in $(docker-compose -p "${1}" ps --services); do
    local containerID=$(docker ps -q --filter name="${1}_${service}")

    if [[ $(docker inspect --format '{{ .State.Health }}' "${containerID}") != '<nil>' ]]; then
      docker inspect --format='{{ .Name }}{{ "\n" }}{{range .State.Health.Log }}code={{ .ExitCode }}, log={{ .Output }}{{ end }}' "${containerID}"
    fi
  done

  docker-compose -p "${1}" rm --force --stop -v
}

clean_old_services() {
  echo "Stopping and removing old containers ${@}"

  docker stop --time=180 "${@}"
  docker rm -f -v "${@}"
}

rename_services() {
  if [[ "${#}" -ne 2 ]]; then
    echo "Usage: rename_services [PROJECT_FULLNAME] [PROJECT_NAME]"
    return 1
  fi

  echo "Renaming containers from ${1} to ${2}"

  for service in $(docker-compose -p "${1}" ps --services); do
    local containerID=$(docker ps -q --filter name="${1}_${service}")
    docker rename "${containerID}" "${2}_${service}"
  done
}

deploy_services() {
  if [[ "${#}" -ne 1 ]]; then
    echo "Usage: deploy_services [PROJECT_NAME]"
    return 1
  fi

  local oldServices=$(docker ps -f name="${1}*" -q)
  local PROJECT_FULLNAME="${1}$(git rev-parse --short HEAD)"

  start_services "${PROJECT_FULLNAME}"

  echo "Waiting 35 seconds for containers to start..."
  timeout=$(date --date="35 seconds" +%s)

  local healthcheckCount=$(count_healthy_services "${PROJECT_FULLNAME}")
  local healthyCount=$(docker events --until "${timeout}" -f event="health_status: healthy" -f name="${PROJECT_FULLNAME}" | wc -l)

  echo "Expecting ${healthcheckCount} services to send health, got ${healthyCount}"

  if [[ "${healthcheckCount}" != "${healthyCount}" ]]; then
    revert_services "${PROJECT_FULLNAME}"
    return 1
  fi

  if [[ ! -z "${oldServices}" ]]; then
    clean_old_services ${oldServices}
  fi

  rename_services "${PROJECT_FULLNAME}" "${1}"

  echo "Deploy successful!"
}

main() {
  export PATH=${PATH}:/opt/bin

  if [[ "${#}" -ne 2 ]]; then
    echo "Usage: deploy.sh [PROJECT_NAME] [PROJECT_URL]"
    return 1
  fi

  if [[ ! -d "${1}" ]]; then
    git clone "${2}" "${1}"
  fi

  pushd "${1}"

  git pull

  echo "Deploying ${1}"
  deploy_services "${1}"
  docker system prune -f || true

  popd
}

main "${@}"
