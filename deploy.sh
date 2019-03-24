#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail


main() {
  export PATH=${PATH}:/opt/bin

  curl -O https://raw.githubusercontent.com/ViBiOh/docker-compose-deploy/master/deploy.sh
  chmod +x deploy.sh

  curl -o docker-compose-dashboard.yml https://raw.githubusercontent.com/ViBiOh/dashboard/master/docker-compose.yml

  ./deploy.sh "dashboard" $(git rev-parse --short HEAD) docker-compose-dashboard.yml

  set +e
  docker system prune -f
  set -e
}

main "${@}"
