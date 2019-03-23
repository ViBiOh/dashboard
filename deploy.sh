#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

read_variable_if_required() {
  if [[ -z "${!1}" ]]; then
    read -p "${1}=" ${1}
  else
    echo "${1}="${!1}
  fi
}

start_services() {
  local PROJECT_FULLNAME=${1:-}
  read_variable_if_required "PROJECT_FULLNAME"

  docker-compose -p "${PROJECT_FULLNAME}" config -q
  docker-compose -p "${PROJECT_FULLNAME}" pull
  docker-compose -p "${PROJECT_FULLNAME}" up -d
}

count_healthy_services() {
  local PROJECT_FULLNAME=${1:-}
  read_variable_if_required "PROJECT_FULLNAME"

  local counter=0

  for service in $(docker-compose -p "${PROJECT_FULLNAME}" ps --services); do
    local containerID=$(docker ps -q --filter name="${PROJECT_FULLNAME}_${service}")

    if [[ $(docker inspect --format '{{ .State.Health }}' "${containerID}") != '<nil>' ]]; then
      counter=$((counter+1))
    fi
  done

  echo "${counter}"
}

revert_services() {
  local PROJECT_FULLNAME=${1:-}
  read_variable_if_required "PROJECT_FULLNAME"

  echo "Containers didn't start, reverting..."

  docker-compose -p "${PROJECT_FULLNAME}" logs || true

  for service in $(docker-compose -p "${PROJECT_FULLNAME}" ps --services); do
    local containerID=$(docker ps -q --filter name="${PROJECT_FULLNAME}_${service}")

    if [[ $(docker inspect --format '{{ .State.Health }}' "${containerID}") != '<nil>' ]]; then
      docker inspect --format='{{ .Name }}{{ "\n" }}{{range .State.Health.Log }}code={{ .ExitCode }}, log={{ .Output }}{{ end }}' "${containerID}"
    fi
  done

  docker-compose -p "${PROJECT_FULLNAME}" rm --force --stop -v
}

clean_old_services() {
  echo "Stopping and removing old containers ${@}"
  docker stop --time=180 "${@}"
  docker rm -f -v "${@}"
}

rename_services() {
  local PROJECT_NAME=${1:-}
  read_variable_if_required "PROJECT_NAME"
  local PROJECT_FULLNAME=${2:-}
  read_variable_if_required "PROJECT_FULLNAME"

  echo "Renaming containers from ${PROJECT_FULLNAME} to ${PROJECT_NAME}"

  for service in $(docker-compose -p "${PROJECT_FULLNAME}" ps --services); do
    local containerID=$(docker ps -q --filter name="${PROJECT_FULLNAME}_${service}")
    docker rename "${containerID}" "${PROJECT_NAME}_${service}"
  done
}

deploy_services() {
  local PROJECT_NAME="${1:-}"
  read_variable_if_required "PROJECT_NAME"

  local oldServices=$(docker ps -f name="${PROJECT_NAME}*" -q)
  local PROJECT_FULLNAME="${PROJECT_NAME}$(git rev-parse --short HEAD)"

  start_services "${PROJECT_FULLNAME}"

  echo "Waiting 35 seconds for containers to start..."
  timeout=$(date --date="35 seconds" +%s)

  local healthcheckCount=$(count_healthy_services "${PROJECT_FULLNAME}")
  local healthyCount=$(docker events --until "${timeout}" -f event="health_status: healthy" -f name="${PROJECT_FULLNAME}" | wc -l)

  if [[ "${healthcheckCount}" != "${healthyCount}" ]]; then
    revert_services "${PROJECT_FULLNAME}"
    return 1
  fi

  if [[ ! -z "${oldServices}" ]]; then
    clean_old_services ${oldServices}
  fi

  rename_services "${PROJECT_FULLNAME}" "${PROJECT_NAME}"

  echo "Deploy successful!"
}

main() {
  export PATH=${PATH}:/opt/bin

  local PROJECT_NAME=${1:-}
  read_variable_if_required "PROJECT_NAME"

  local PROJECT_URL=${2:-}
  read_variable_if_required "PROJECT_URL"

  if [[ ! -d "${PROJECT_NAME}" ]]; then
    git clone "${PROJECT_URL}" "${PROJECT_NAME}"
  fi

  pushd "${PROJECT_NAME}"

  git pull

  echo "Deploying ${PROJECT_NAME}"
  deploy_services "${PROJECT_NAME}"
  docker system prune -f || true

  popd
}

main "${@}"
