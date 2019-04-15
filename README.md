# dashboard

[![Build Status](https://travis-ci.org/ViBiOh/dashboard.svg?branch=master)](https://travis-ci.org/ViBiOh/dashboard)
[![Doc Status](https://doc.esdoc.org/github.com/ViBiOh/dashboard/badge.svg)](https://doc.esdoc.org/github.com/ViBiOh/dashboard)
[![codecov](https://codecov.io/gh/ViBiOh/dashboard/branch/master/graph/badge.svg)](https://codecov.io/gh/ViBiOh/dashboard)
[![Go Report Card](https://goreportcard.com/badge/github.com/ViBiOh/dashboard)](https://goreportcard.com/report/github.com/ViBiOh/dashboard)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FViBiOh%2Fdashboard.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FViBiOh%2Fdashboard?ref=badge_shield)

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FViBiOh%2Fdashboard.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FViBiOh%2Fdashboard?ref=badge_large)

# ⚠️ Deprecation ⚠️

> I no longer maintain this repository, I've switched to [deploy](https://github.com/ViBiOh/deploy) which provide a **true** support of all `docker-compose` features, with a [Portainer](https://portainer.io) for monitoring.

Docker infrastructure management with security and simplicity as goals. It allows to list all containers on a `daemon`, start / stop / restart / monitor each one and deploy `docker-compose` app [**with limited volumes**](#why-with-limited-volumes-). Every action is available from Mobile-ready UI or API.

List all your containers

![](/img/list.png)

View detailed informations about containers, start / stop / restart them.

![](/img/detail.png)

# Getting Started

## Features

* Traefik ready
* Github OAuth / Basic Login
* Deploy without downtime
* Full TLS support
* Opentracing with Jaeger
* Prometheus monitoring
* Rollbar error reporting
* Read-only containers

## Docker

Docker's images are available, `vibioh/dashboard-ui` and `vibioh/dashboard-api`, and a `docker-compose.yml` generator. Everything is almost configured, you only have to tweak domain's name, mainly configured for being used with [traefik](https://traefik.io), and adjust some secrets.

For generating `docker-compose`, use `cmd/compose/compose.go` tools provided :

```bash
Usage of cmd/compose.go:
  -authBasic
      Basic auth
  -domain string
      Domain name (default "vibioh.fr")
  -environment string
      Environment (default "prod")
  -expose
      Expose opened ports
  -github
      Github logging (default true)
  -mailer
      Enable mailer (default true)
  -rollbar
      Rollbar error reporting (default true)
  -selenium
      Selenium container
  -tag string
      Docker tag used
  -tls
      TLS for all containers (default true)
  -tracing
      Enable opentracing (default true)
  -traefik
      Traefik load-balancer (default true)
  -user
      Enable docker user default
  -users string
      Allowed users list (default "admin:admin")
  -version string
      Docker image version
```

## Websocket

By default, your origin domain name has to start with `dashboard` (e.g. dashboard-api.vibioh.fr) in order to allow websockets to work. You can override it by setting `-ws` option to the API server.

## Roles

You have to configure roles by setting `-users` on the API server with the following format:

```
[user1]:[role1]|[role2],[user2]:[role1]
```

Username must match with the authentification providers (see next section).

Role can be `admin`, `multi` or anything else.

* `admin` : Have all rights, can view all containers and can deploy multiple apps.
* `multi` : View only his containers (labeled with his name) and can deploy multiples apps.
* others : View only his containers (labeled with his name) and can deploy only one app (erase all previously deployed containers)

## Authentification

Authentification has been externalized into its own services in [vibioh/auth](https://github.com/vibioh/auth). Check out documentation of this project for configuring authentification for Dashboard.

### GitHub OAuth Provider

Create your OAuth app on [GitHub interface](https://github.com/settings/developers). The authorization callback URL must be in the form of `https://[URL_OF_DASHBOARD]/auth/github`.

## Email notification

Email notification has been externalized into its own services in [vibioh/mailer](https://github.com/vibioh/mailer). Check out documentation of this project for configuring email notification for Dashboard.

## Deploy

When deploying, images are pulled and all services are started. After successful deploy, old images are removed, if possible, from docker host in order to free up disk space. An email notification is sent if service has been configured.

## HotDeploy

At deploy time, if the new containers have [`HEALTHCHECK`](https://docs.docker.com/engine/reference/builder/#healthcheck), `dashboard` will wait during at most 5 minutes for an `healthy` status. When all containers with `healthcheck` are healthy, old containers are stopped and removed. Load-balancer with Docker's healthcheck (e.g. [traefik](https://traefik.io)) will handle route change without downtime based on that healthcheck.

If no healthcheck is provided, `dashboard` doesn't know if your container is ready for business, so it's a simple launch new containers then destroy old containers, without waiting time.

If you don't have an healthcheck on your container, check [vibioh/httputils](https://github.com/ViBiOh/httputils) for having a simple HTTP Client that request the defined endpoint with `alcotest`.

## Monitoring

[Prometheus](https://prometheus.io/) is embed in every service to monitor basic Golang metrics. Data are available on the `/metrics` endpoint.

## Tracing

[Opentracing](http://opentracing.io/) is embed in every service to trace incoming (except for healhtcheck and metrics) or outcoming request. [Jaeger](https://www.jaegertracing.io/) is used as tracing implementation and configurable via CLI of each service.

## Error reporting

[Rollbar](https://rollbar.com/) is embed in every service to report every error. Token, environment and server root are configurable vie CLI of each service.

### Deploy notification

While deploying, Dashboard can also send [deploy notification](https://docs.rollbar.com/docs/bash) after successful deploy. You have to provide following query parameters :

* `rollbar_token` Rollbar token allowed to send deploy notification
* `user` User at the origin of deploy
* `revision` Git sha1 of current version
* `environment` Environment deployed

## Another Docker Infrastructure Manager ?

Why creating another infrastructure manager when Rancher or Portainer exists ?

Because :

* I have only one server, setup should be easy
* I want people to deploy on my server but I don't want them to use too much ressources, quota of containers has to be defined
* I want people to deploy containers without fear for my server security or disk space
* I want people to deploy containers easily with a simple `curl` command, from CI
* I want people to be able to manage theirs containers by their own (lifecycle, configuration, monitoring, logs, etc.) without granting ssh access

And, maybe, I want to have fun with `golang` and `ReactJS` 🙄 😏

## Why with limited volumes ?

First goal of this tool was to be available for students to deploy containers on my own server. Trust doesn't mean no control and if a student mounts a too critical volumes (e.g. `/`) with a `root` user, he can potentially become `root` on the server, which for some obvious reasons I don't want ! So volumes are not allowed if you're not an admin, and some security options are setted by default.

## Build

### Server

In order to build the server stuff, run the following command.

```bash
make
```

It will compile API server.

```bash
Usage of dashboard:
  -authDisable
      [auth] Disable auth
  -authUrl string
      [auth] Auth URL, if remote
  -authUsers string
      [auth] List of allowed users and profiles (e.g. user:profile1|profile2,user2:profile3)
  -corsCredentials
      [cors] Access-Control-Allow-Credentials
  -corsExpose string
      [cors] Access-Control-Expose-Headers
  -corsHeaders string
      [cors] Access-Control-Allow-Headers (default "Content-Type")
  -corsMethods string
      [cors] Access-Control-Allow-Methods (default "GET")
  -corsOrigin string
      [cors] Access-Control-Allow-Origin (default "*")
  -csp string
      [owasp] Content-Security-Policy (default "default-src 'self'; base-uri 'self'")
  -dockerAppURL string
      [deploy] Application web URL (default "https://dashboard.vibioh.fr")
  -dockerContainerUser string
      [deploy] Default container user (default "1000")
  -dockerHost string
      [docker] Host (default "unix:///var/run/docker.sock")
  -dockerNetwork string
      [deploy] Default Network (default "traefik")
  -dockerNotification string
      [deploy] Send email notification when deploy ends (possibles values ares "never", "onError", "all") (default "onError")
  -dockerTag string
      [deploy] Default image tag) (default "latest")
  -dockerVersion string
      [docker] API Version
  -dockerWs string
      [stream] Allowed WebSocket Origin pattern (default "^dashboard")
  -frameOptions string
      [owasp] X-Frame-Options (default "deny")
  -hsts
      [owasp] Indicate Strict Transport Security (default true)
  -mailerPass string
      [mailer] Mailer Pass
  -mailerURL string
      [mailer] Mailer URL (default "https://mailer.vibioh.fr")
  -mailerUser string
      [mailer] Mailer User
  -port int
      Listen port (default 1080)
  -prometheusPath string
      [prometheus] Path for exposing metrics (default "/metrics")
  -rollbarEnv string
      [rollbar] Environment (default "prod")
  -rollbarServerRoot string
      [rollbar] Server Root
  -rollbarToken string
      [rollbar] Token
  -tls
      Serve TLS content (default true)
  -tlsCert string
      [tls] PEM Certificate file
  -tlsHosts string
      [tls] Self-signed certificate hosts, comma separated (default "localhost")
  -tlsKey string
      [tls] PEM Key file
  -tlsOrganization string
      [tls] Self-signed certificate organization (default "ViBiOh")
  -tracingAgent string
      [opentracing] Jaeger Agent (e.g. host:port) (default "jaeger:6831")
  -tracingName string
      [opentracing] Service name
  -url string
      [health] URL to check
  -userAgent string
      [health] User-Agent for check (default "Golang alcotest")
```

### Front

In order to build the front stuff, run the following command:

```bash
npm i
npm run build
```

## Local run

```bash
make start-deps
./bin/compose -authBasic -domain=:1080 -expose -mailer=false -github=false -tls=false -traefik=false > docker-compose.local.yml
export ADMIN_PASSWORD=`bcrypt password`
docker-compose -p dashboard -f docker-compose.local.yml up -d
```


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FViBiOh%2Fdashboard.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FViBiOh%2Fdashboard?ref=badge_large)
