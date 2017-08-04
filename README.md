# dashboard

[![Build Status](https://travis-ci.org/ViBiOh/dashboard.svg?branch=master)](https://travis-ci.org/ViBiOh/dashboard)
[![Doc Status](https://doc.esdoc.org/github.com/ViBiOh/dashboard/badge.svg)](https://doc.esdoc.org/github.com/ViBiOh/dashboard)
[![codecov](https://codecov.io/gh/ViBiOh/dashboard/branch/master/graph/badge.svg)](https://codecov.io/gh/ViBiOh/dashboard)
[![Go Report Card](https://goreportcard.com/badge/github.com/ViBiOh/dashboard)](https://goreportcard.com/report/github.com/ViBiOh/dashboard)

Docker infrastructure management with security and simplicity as goals. It allows to list all containers on a `daemon`, start / stop / restart / monitor each one and deploy `docker-compose` app [**without volumes**](#why-without-volumes-).

## Usage

Write user's credentials file with one line per user, having the following format :

```
[username],[bcrypt password],[role]
```

Role can be `admin`, `multi` or anything else.

* `admin` : Have all rights, can view all containers and can deploy multiple apps.
* `multi` : View only his containers (labeled with his name) and can deploy multiples apps.
* others : View only his containers (labeled with his name) and can deploy only one app (erase all previously deployed containers)

### Running

Docker's images are available, `vibioh/dashboard-front` et `vibioh/dashboard-api` and `docker-compose.yml` provided is almost configured, only tweak domain's name, mainly configured for be used with [traefik](https://traefik.io), and secrets.

By default, your origin domain name has to start with `dashboard` (e.g. dashboard.vibioh.fr) in order to allow websockets to work. You can override it by setting `-ws` option to the API server.

You have to define several environments variables :

* `DOCKER_HOST` Docker Host connexion
* `DOCKER_VERSION` Docker Version of API
* `GITHUB_OAUTH_STATE` A random string for OAuth flow
* `GITHUB_OAUTH_CLIENT_ID` Client ID
* `GITHUB_OAUTH_CLIENT_SECRET` Client Secret

## Another Docker Infrastructure Manager ?

Why creating another infrastructure manager when Rancher or Portainer exists ?

Because :

* I have only one server, setup should be easy
* I want people to deploy on my server but I don't want them to use too much ressources, quota of containers has to be defined
* I want people to deploy containers without fear for my server security or disk space
* I want people to deploy containers easily with a simple `curl` command, from CI
* I want people to be able to manage theirs containers by their own (lifecycle, configuration, monitoring, logs, etc.) without granting ssh access

And, maybe, I want to have fun with `golang` and `ReactJS` 🙄😏

## Why without volumes ?

First goal of this tool was to be available for students to deploy containers on my own server. Trust doesn't mean no control and if a student mounts a too critical volumes (e.g. `/`) with a `root` user, he can potentially become `root` on the server, which I don't want ! So volumes are not allowed, and some security options are setted by default.

## HotDeploy

At deploy time, if the new containers have [`HEALTHCHECK`](https://docs.docker.com/engine/reference/builder/#healthcheck), `dashboard` will wait during at most 5 minutes for an `healthy` status. When all containers with `healthcheck` are healthy, old containers are stopped and removed. Load-balancer with Docker's healthcheck (e.g. [traefik](https://traefik.io)) will handle route change without downtime based on that healthcheck.

If no healthcheck is provided, `dashboard` doesn't know if your container is ready for business, so it's a simple launch new containers then destroy old containers, without waiting time.

If you don't have an healthcheck on your container, check [vibioh/alcotest](https://github.com/ViBiOh/alcotest) for having a simple HTTP Client that request the defined endpoint.

## Build

In order to build the whole stuff, run the following command.

```sh
make
```

It will compile both API server and password encrypter.

API server uses `${DOCKER_HOST}` and `${DOCKER_VERSION}` to connect to Docker's daemon and have two more options on CLI :

```
Usage of dashboard:
  -auth string
      Path of authentification configuration file
  -ws string
      Allowed WebSocket Origin pattern (default "^dashboard")
```

Password encrypter accepts one argument, the password, and output the bcrypted one.
