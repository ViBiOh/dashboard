#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

start_services() {
  if [[ "${#}" -ne 2 ]]; then
    echo "Usage: start_services [PROJECT_FULLNAME] [PROJECT_NAME]"
    return 1
  fi

  local PROJECT_FULLNAME="${1}"
  local PROJECT_NAME="${2}"

  echo "Deploying ${PROJECT_NAME}"
  echo

  docker-compose -p "${PROJECT_FULLNAME}" config -q
  docker-compose -p "${PROJECT_FULLNAME}" pull
  docker-compose -p "${PROJECT_FULLNAME}" up -d
}

count_services_with_health() {
  if [[ "${#}" -ne 1 ]]; then
    echo "Usage: count_services_with_health [PROJECT_FULLNAME]"
    return 1
  fi

  local PROJECT_FULLNAME="${1}"

  local counter=0

  for service in $(docker-compose -p "${PROJECT_FULLNAME}" ps -q); do
    if [[ $(docker inspect --format '{{ .State.Health }}' "${service}") != '<nil>' ]]; then
      counter=$((counter+1))
    fi
  done

  echo "${counter}"
}

are_services_healthy() {
  if [[ "${#}" -ne 1 ]]; then
    echo "Usage: are_services_healthy [PROJECT_FULLNAME]"
    return 1
  fi

  local PROJECT_FULLNAME="${1}"

  local WAIT_TIMEOUT="35"

  echo "Waiting ${WAIT_TIMEOUT} seconds for containers to start..."
  echo
  timeout=$(date --date="${WAIT_TIMEOUT} seconds" +%s)

  local healthcheckCount=$(count_services_with_health "${PROJECT_FULLNAME}")
  local healthyCount=$(docker events --until "${timeout}" -f event="health_status: healthy" -f name="${PROJECT_FULLNAME}" | wc -l)

  [[ "${healthcheckCount}" == "${healthyCount}" ]] && echo "true" || echo "false"
}

revert_services() {
  if [[ "${#}" -ne 1 ]]; then
    echo "Usage: revert_services [PROJECT_FULLNAME]"
    return 1
  fi

  local PROJECT_FULLNAME="${1}"

  echo "Containers didn't start, reverting..."
  echo

  # Force continuation in case of errors for keeping a clean state
  set +e

  docker-compose -p "${PROJECT_FULLNAME}" logs

  for service in $(docker-compose -p "${PROJECT_FULLNAME}" ps -q); do
    if [[ $(docker inspect --format '{{ .State.Health }}' "${service}") != '<nil>' ]]; then
      docker inspect --format='{{ .Name }}{{ "\n" }}{{range .State.Health.Log }}code={{ .ExitCode }}, log={{ .Output }}{{ end }}' "${service}"
    fi
  done

  docker-compose -p "${PROJECT_FULLNAME}" rm --force --stop -v

  set -e
}

remove_old_services() {
  if [[ "${#}" -ne 2 ]]; then
    echo "Usage: remove_old_services [PROJECT_FULLNAME] [PROJECT_NAME]"
    return 1
  fi

  local PROJECT_FULLNAME="${1}"
  local PROJECT_NAME="${2}"

  echo "Removing old containers from ${PROJECT_NAME}"
  echo

  local projectServices=($(docker ps -f name="${PROJECT_NAME}*" -q))
  local composeServices=($(docker-compose -p "${PROJECT_FULLNAME}" ps -q))

  local containersToRemove=()

  for projectService in "${projectServices[@]}"; do
    local found=0

    for composeService in "${composeServices[@]}"; do
      if [[ "${projectService:0:12}" == "${composeService:0:12}" ]]; then
        found=1
        break
      fi
    done

    if [[ "${found}" -eq 0 ]]; then
      containersToRemove+=("${projectService}")
    fi
  done

  if [[ "${#containersToRemove[@]}" -gt 0 ]]; then
    docker stop --time=180 ${containersToRemove[@]}
    docker rm -f -v ${containersToRemove[@]}
  fi
}

rename_new_services() {
  if [[ "${#}" -ne 2 ]]; then
    echo "Usage: rename_new_services [PROJECT_FULLNAME] [PROJECT_NAME]"
    return 1
  fi

  local PROJECT_FULLNAME="${1}"
  local PROJECT_NAME="${2}"

  echo "Renaming containers from ${PROJECT_FULLNAME} to ${PROJECT_NAME}"
  echo

  for service in $(docker-compose -p "${PROJECT_FULLNAME}" ps --services); do
    local containerID=$(docker ps -q --filter name="${PROJECT_FULLNAME}_${service}")
    docker rename "${containerID}" "${PROJECT_NAME}_${service}"
  done
}

deploy_services() {
  if [[ "${#}" -ne 1 ]]; then
    echo "Usage: deploy_services [PROJECT_NAME]"
    return 1
  fi

  local PROJECT_NAME="${1}"
  local PROJECT_FULLNAME="${PROJECT_NAME}$(git rev-parse --short HEAD)"

  start_services "${PROJECT_FULLNAME}" "${PROJECT_NAME}"

  if [[ $(are_services_healthy "${PROJECT_FULLNAME}") == "false" ]]; then
    revert_services "${PROJECT_FULLNAME}"
    return 1
  fi

  remove_old_services "${PROJECT_FULLNAME}" "${PROJECT_NAME}"
  rename_new_services "${PROJECT_FULLNAME}" "${PROJECT_NAME}"

  echo "Deploy successful!"
  echo
}

main() {
  export PATH=${PATH}:/opt/bin

  if [[ "${#}" -ne 2 ]]; then
    echo "Usage: deploy.sh [PROJECT_NAME] [PROJECT_URL]"
    return 1
  fi

  local PROJECT_NAME="${1}"
  local PROJECT_URL="${2}"

  if [[ ! -d "${PROJECT_NAME}" ]]; then
    git clone "${PROJECT_URL}" "${PROJECT_NAME}"
    pushd "${PROJECT_NAME}"
  else
    pushd "${PROJECT_NAME}"
    git pull
  fi

  deploy_services "${PROJECT_NAME}"

  popd

  set +e
  docker system prune -f
  set -e
}

main "${@}"
