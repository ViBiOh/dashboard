package main

import (
	"flag"
	"log"
	"os"
	"strings"
	"text/template"
)

const dockerCompose = `version: '2.1'

services:
  {{- if .Auth }}
  auth:
    image: vibioh/auth
    command:
    {{- if .Prometheus }}
    - -prometheusMetricsHost
    - dashboard-auth:1080
    {{- end }}
    {{- if not .TLS }}
    - -tls=false
    {{- end }}
    {{- if .AuthBasic }}
    - -basicUsers
    - 1:admin:${ADMIN_PASSWORD}
    {{- end }}
    - -corsHeaders
    - Authorization
    - -corsCredentials
    {{- if .Github }}
    - -githubState
    - ${GITHUB_OAUTH_STATE}
    - -githubClientId
    - ${GITHUB_OAUTH_CLIENT_ID}
    - -githubClientSecret
    - ${GITHUB_OAUTH_CLIENT_SECRET}
    {{- end }}
    {{- if .Traefik }}
    labels:
      traefik.frontend.passHostHeader: 'true'
      traefik.frontend.rule: 'Host: dasboard-auth{{ .Domain }}'
      traefik.protocol: 'http{{ if .TLS }}s{{ end }}'
      traefik.port: '1080'
    {{- end }}
    {{- if not .TLS }}
    healthcheck:
      test: [ "CMD", "/bin/sh", "-c", "http://localhost:1080/health" ]
    {{- end }}
    {{- if .Expose }}
    ports:
    - 1081:1080/tcp
    {{- end }}
    {{- if .Prometheus }}
    networks:
      default:
        aliases:
        - dashboard-auth
    {{- end }}
    logging:
      driver: json-file
      options:
        max-size: '50m'
    restart: on-failure:5
    read_only: true
    cpu_shares: 128
    mem_limit: 67108864
    security_opt:
    - no-new-privileges
  {{- end }}

  api:
    image: vibioh/dashboard-api
    command:
    {{- if .Prometheus }}
    - -prometheusMetricsHost
    - dashboard-api:1080
    {{- end }}
    {{- if not .TLS }}
    - -tls=false
    {{- end }}
    - -ws
    {{- if .Traefik }}
    - ^dashboard-api{{ .Domain }}$$
    {{- else }}
    - .*
    {{- end }}
    - -dockerVersion
    - '1.24'
    - -authUrl
    {{- if .Traefik }}
    - http{{ if .TLS }}s{{ end }}://dasboard-auth{{ .Domain }}
    {{- else }}
    - http{{ if .TLS }}s{{ end }}://auth{{ .Domain }}
    {{- end }}
    - -authUsers
    - {{ .Users }}
    - -corsHeaders
    - Content-Type,Authorization
    - -corsMethods
    - GET,POST,DELETE
    - -corsCredentials
    - -csp
    - "default-src 'self'; script-src 'unsafe-inline' ajax.googleapis.com cdnjs.cloudflare.com; style-src 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; font-src data: fonts.gstatic.com cdnjs.cloudflare.com; img-src data:"
    {{- if .Traefik }}
    labels:
      traefik.frontend.passHostHeader: 'true'
      traefik.frontend.rule: 'Host: dashboard-api{{ .Domain }}'
      traefik.protocol: 'http{{ if .TLS }}s{{ end }}'
      traefik.port: '1080'
    {{- end }}
    {{- if not .TLS }}
    healthcheck:
      test: [ "CMD", "/bin/sh", "-c", "http://localhost:1080/health" ]
    {{- end }}
    {{- if .Expose }}
    ports:
    - 1082:1080/tcp
    {{- end }}
    {{- if .Prometheus }}
    networks:
      default:
        aliases:
        - dashboard-api
    {{- end }}
    volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    logging:
      driver: json-file
      options:
        max-size: '10m'
    restart: on-failure:5
    read_only: true
    cpu_shares: 128
    mem_limit: 67108864
    security_opt:
    - no-new-privileges

  front:
    image: vibioh/dashboard-front
    command:
    {{- if .Prometheus }}
    - -prometheusMetricsHost
    - dashboard:1080
    {{- end }}
    {{- if .TLS }}
    - -tls
    {{- end }}
    - -spa
    - -env
    - API_URL,WS_URL,AUTH_URL,BASIC_AUTH_ENABLED{{ if .Github }},GITHUB_OAUTH_CLIENT_ID,GITHUB_OAUTH_STATE,GITHUB_REDIRECT_URI{{ end }}
    - -csp
    - "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws{{ if .TLS }}s{{ end }}: {{ if .Traefik }}dashboard-api{{ .Domain }} dasboard-auth{{ .Domain }}{{ else }}{{ if .Expose }}{{ if .Auth }}localhost:1081{{ end }} localhost:1082{{ else }}api:1080 {{ if .Auth }}auth:1080{{ end }}{{ end }}{{ end }};"
    {{- if .Traefik }}
    labels:
      traefik.frontend.passHostHeader: 'true'
      traefik.frontend.rule: 'Host: dashboard{{ .Domain }}'
      traefik.protocol: 'http{{ if .TLS }}s{{ end }}'
      traefik.port: '1080'
    {{- end }}
    {{- if not .TLS }}
    healthcheck:
      test: [ "CMD", "/bin/sh", "-c", "http://localhost:1080/health" ]
    {{- end }}
    {{- if .Expose }}
    ports:
    - 1080:1080/tcp
    {{- end }}
    environment:
      {{- if .Traefik }}
      API_URL: 'http{{ if .TLS }}s{{ end }}://dashboard-api{{ .Domain }}'
      WS_URL: 'ws{{ if .TLS }}s{{ end }}://dashboard-api{{ .Domain }}/ws'
      AUTH_URL: 'http{{ if .TLS }}s{{ end }}://dasboard-auth{{ .Domain }}'
      {{- else }}
      {{- if .Expose }}
      API_URL: 'http{{ if .TLS }}s{{ end }}://localhost:1082'
      WS_URL: 'ws{{ if .TLS }}s{{ end }}://localhost:1082/ws'
      {{- if .Auth }}
      AUTH_URL: 'http{{ if .TLS }}s{{ end }}://localhost:1081'
      {{- end }}
      {{- else }}
      API_URL: 'http{{ if .TLS }}s{{ end }}://api:1080'
      WS_URL: 'ws{{ if .TLS }}s{{ end }}://api:1080/ws'
      {{- if .Auth }}
      AUTH_URL: 'http{{ if .TLS }}s{{ end }}://auth:1080'
      {{- end }}
      {{- end }}
      {{- end }}
      {{- if .Github }}
      BASIC_AUTH_ENABLED: 'false'
      GITHUB_OAUTH_STATE: '${GITHUB_OAUTH_STATE}'
      GITHUB_OAUTH_CLIENT_ID: '${GITHUB_OAUTH_CLIENT_ID}'
      GITHUB_REDIRECT_URI: 'http{{ if .TLS }}s{{ end }}://dashboard{{ .Domain }}/auth/github'
      {{- else }}
      BASIC_AUTH_ENABLED: 'true'
      {{- end }}
    {{- if .Prometheus }}
    networks:
      default:
        aliases:
        - dashboard
    {{- end }}
    logging:
      driver: json-file
      options:
        max-size: '10m'
    restart: on-failure:5
    read_only: true
    cpu_shares: 128
    mem_limit: 67108864
    security_opt:
    - no-new-privileges
  {{ if .Selenium }}
  chrome:
    image: selenium/standalone-chrome
    ports:
    - 4444:4444/tcp
    volumes:
    - /dev/shm:/dev/shm
    logging:
      driver: json-file
      options:
        max-size: '50m'
    restart: on-failure:5
    cpu_shares: 128
    mem_limit: 1073741824
  {{- end }}
{{- if .Traefik }}
networks:
  default:
    external:
      name: traefik
{{- end }}
`

type arguments struct {
	TLS        bool
	Auth       bool
	AuthBasic  bool
	Traefik    bool
	Prometheus bool
	Github     bool
	Selenium   bool
	Expose     bool
	Domain     string
	Users      string
}

func main() {
	tls := flag.Bool(`tls`, true, `TLS for all containers`)
	auth := flag.Bool(`auth`, true, `Auth service`)
	authBasic := flag.Bool(`authBasic`, false, `Basic auth`)
	traefik := flag.Bool(`traefik`, true, `Traefik load-balancer`)
	prometheus := flag.Bool(`prometheus`, true, `Prometheus monitoring`)
	github := flag.Bool(`github`, true, `Github logging`)
	selenium := flag.Bool(`selenium`, false, `Selenium container`)
	domain := flag.String(`domain`, `vibioh.fr`, `Domain name`)
	users := flag.String(`users`, `admin:admin`, `Allowed users list`)
	expose := flag.Bool(`expose`, false, `Expose opened ports`)
	flag.Parse()

	tmpl, err := template.New(`docker-compose`).Parse(dockerCompose)
	if err != nil {
		log.Printf(`Error while parsing template: %v`, err)
	} else {
		prefixedDomain := `.` + *domain
		if strings.HasPrefix(*domain, `:`) {
			prefixedDomain = *domain
		}

		if err := tmpl.Execute(os.Stdout, arguments{*tls, *auth, *authBasic, *traefik, *prometheus, *github, *selenium, *expose, prefixedDomain, *users}); err != nil {
			log.Printf(`Error while rendering template: %v`, err)
		}
	}
}
