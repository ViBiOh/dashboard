# dashboard

[![Build Status](https://travis-ci.org/ViBiOh/dashboard.svg?branch=master)](https://travis-ci.org/ViBiOh/dashboard)
[![Doc Status](https://doc.esdoc.org/github.com/ViBiOh/dashboard/badge.svg)](https://doc.esdoc.org/github.com/ViBiOh/dashboard)
[![codecov](https://codecov.io/gh/ViBiOh/dashboard/branch/master/graph/badge.svg)](https://codecov.io/gh/ViBiOh/dashboard)
[![Go Report Card](https://goreportcard.com/badge/github.com/ViBiOh/dashboard)](https://goreportcard.com/report/github.com/ViBiOh/dashboard)

Docker infrastructure management with security and simplicity as goals. It allows to list all containers on a `daemon`, start / stop / restart / monitor each one and deploy `docker-compose` app [**without volumes**](#why-without-volumes-).

# Getting Started

## Docker

Docker's images are available, `vibioh/dashboard-front` and `vibioh/dashboard-api`, and a sample `docker-compose.yml`. Everything is almost configured, you only have to tweak domain's name, mainly configured for being used with [traefik](https://traefik.io), and adjust some secrets.

## Websocket

By default, your origin domain name has to start with `dashboard` (e.g. dashboard.vibioh.fr) in order to allow websockets to work. You can override it by setting `-ws` option to the API server.

## Roles

You have to configure roles by setting `-users` on the API server with the following format:

```
[user1]:[role1],[role2]|[user2]:[role1]
```

Username must match with the authentification providers (see next section).

Role can be `admin`, `multi` or anything else.

* `admin` : Have all rights, can view all containers and can deploy multiple apps.
* `multi` : View only his containers (labeled with his name) and can deploy multiples apps.
* others : View only his containers (labeled with his name) and can deploy only one app (erase all previously deployed containers)

## Authentification

Authentification has been externalized into its own services in [vibioh/auth](https://github.com/vibioh/auth). Check out this project for configuring authentification for Dashboard.

### GitHub OAuth Provider

Create your OAuth app on [GitHub interface](https://github.com/settings/developers). The authorization callback URL must be in the form of `https://[URL_OF_DASHBOARD]/auth/github`.

## HotDeploy

At deploy time, if the new containers have [`HEALTHCHECK`](https://docs.docker.com/engine/reference/builder/#healthcheck), `dashboard` will wait during at most 5 minutes for an `healthy` status. When all containers with `healthcheck` are healthy, old containers are stopped and removed. Load-balancer with Docker's healthcheck (e.g. [traefik](https://traefik.io)) will handle route change without downtime based on that healthcheck.

If no healthcheck is provided, `dashboard` doesn't know if your container is ready for business, so it's a simple launch new containers then destroy old containers, without waiting time.

If you don't have an healthcheck on your container, check [vibioh/alcotest](https://github.com/ViBiOh/alcotest) for having a simple HTTP Client that request the defined endpoint.

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

## Build

In order to build the server stuff, run the following command.

```
make
```

It will compile both API server, auth API server and password encrypter.

```
Usage of dashboard:
  -authUrl string
      URL of auth service
  -c string
      URL to healthcheck (check and exit)
  -corsHeaders string
      Access-Control-Allow-Headers (default "Content-Type")
  -corsMethods string
      Access-Control-Allow-Methods (default "GET")
  -corsOrigin string
      Access-Control-Allow-Origin (default "*")
  -csp string
      Content-Security-Policy (default "default-src 'self'")
  -dockerHost string
      Docker Host (default "unix:///var/run/docker.sock")
  -dockerVersion string
      Docker API Version
  -hsts
      Indicate Strict Transport Security (default true)
  -prometheusMetricsPath string
      Prometheus - Metrics endpoint path (default "/metrics")
  -prometheusMetricsRemoteHost string
      Prometheus - Regex of allowed hosts to call metrics endpoint (default ".*")
  -tlscert string
      TLS PEM Certificate file
  -tlshosts string
      TLS Self-signed certificate hosts, comma separated (default "localhost")
  -tlskey string
      TLS PEM Key file
  -users string
      List of allowed users and profiles (e.g. user:profile1,profile2|user2:profile3
  -ws string
      Allowed WebSocket Origin pattern (default "^dashboard")
```


## Local run

```
docker-compose -p dashboard -f docker-compose-local.yml up -d
```
