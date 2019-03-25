#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail


main() {
  export PATH="${PATH}:/opt/bin"

  curl -O https://raw.githubusercontent.com/ViBiOh/docker-compose-deploy/master/deploy.sh
  chmod +x deploy.sh

  local COMPOSE_FILE="docker-compose-dashboard.yml"
  curl -o "${COMPOSE_FILE}" https://raw.githubusercontent.com/ViBiOh/dashboard/master/docker-compose.yml

  ./deploy.sh "dashboard" "${1:-SHA1}" "${COMPOSE_FILE}"

  set +e
  rm -rf deploy.sh "${COMPOSE_FILE}"
  docker system prune -f
  set -e
}

main "${@}"
