# dashboard

[![Build Status](https://travis-ci.org/ViBiOh/dashboard.svg?branch=master)](https://travis-ci.org/ViBiOh/dashboard)
[![Doc Status](https://doc.esdoc.org/github.com/ViBiOh/dashboard/badge.svg)](https://doc.esdoc.org/github.com/ViBiOh/dashboard)
[![codecov](https://codecov.io/gh/ViBiOh/dashboard/branch/master/graph/badge.svg)](https://codecov.io/gh/ViBiOh/dashboard)
[![Go Report Card](https://goreportcard.com/badge/github.com/ViBiOh/dashboard)](https://goreportcard.com/report/github.com/ViBiOh/dashboard)

## Build

In order to build the whole stuff, run the following command.

```sh
make
```

It will compile both API server and password encrypter.

API server run without options, use `/var/run/docker.sock` to connect to Docker's daemon and read user's credentials file from `./users`;

Password encrypter accepts one argument, the password, and output the bcrypted one.

## Usage

Write user's credentials file with one line per user, having the following format :

```
[username],[bcrypt password],[role]
```

Role can be `admin`, `multi` or anything else.

* `admin` : Have all rights, can view all containers and can deploy multiple apps.
* `multi` : View only his containers (labeled with his name) and can deploy multiples apps.
* others : View only his containers (labeled with his name) and can deploy only on app (erase all previously deployed)

### Running

Docker's images are available, `vibioh/dashboard-front` et `vibioh/dashboard-api` and `docker-compose.yml` provided is almost configured, only tweak domain's name if you use [Traefik](https://traefik.io).

By default, your origin domain name has to start with `dashboard` (e.g. dashboard.vibioh.fr) in order to allow websockets to work. You can override it by setting `-ws` option to the API server.
