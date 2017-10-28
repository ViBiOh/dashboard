package main

import (
	"flag"
	"log"
	"os"
	"strings"
	"text/template"
)

const dockerCompose = `version: '2'

services:
  {{- if .Auth }}
  auth:
    image: vibioh/auth
    command:
    {{- if not .TLS }}
    - tls=false
    {{- end }}
    - -basicUsers
    - admin:${ADMIN_PASSWORD}
    - -corsHeaders
    - Authorization
    - -corsCredentials
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
    - tls=false
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
    - http{{ if .TLS }}s{{ end }}://auth{{ .Domain }}
    - -users
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
    - "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws{{ if .TLS }}s{{ end }}: {{ if .Traefik }}dashboard-api{{ .Domain }} auth{{ .Domain }}{{ else }}api:1080 {{ if .Auth }}auth:1080{{ end }}{{ end }};"
    {{- if .Traefik }}
    labels:
      traefik.frontend.passHostHeader: 'true'
      traefik.frontend.rule: 'Host: dashboard{{ .Domain }}'
      traefik.protocol: 'http{{ if .TLS }}s{{ end }}'
      traefik.port: '1080'
    {{- end }}
    environment:
      {{- if .Traefik }}
      API_URL: 'http{{ if .TLS }}s{{ end }}://dashboard-api{{ .Domain }}'
      WS_URL: 'ws{{ if .TLS }}s{{ end }}://dashboard-api{{ .Domain }}/ws'
      AUTH_URL: 'http{{ if .TLS }}s{{ end }}://auth{{ .Domain }}'
      {{- else }}
      API_URL: 'http{{ if .TLS }}s{{ end }}://api:1080'
      WS_URL: 'ws{{ if .TLS }}s{{ end }}://api:1080/ws'
      {{- if .Auth }}
      AUTH_URL: 'http{{ if .TLS }}s{{ end }}://auth:1080'
      {{- end}}
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

    {{- if .Selenium }}
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
{{ if .Traefik }}
networks:
  default:
    external:
      name: traefik
{{- end }}
`

type arguments struct {
	TLS        bool
	Auth       bool
	Traefik    bool
	Prometheus bool
	Github     bool
	Selenium   bool
	Domain     string
	Users      string
}

func main() {
	tls := flag.Bool(`tls`, true, `TLS for all containers`)
	auth := flag.Bool(`auth`, false, `Auth service`)
	traefik := flag.Bool(`traefik`, true, `Traefik load-balancer`)
	prometheus := flag.Bool(`prometheus`, true, `Prometheus monitoring`)
	github := flag.Bool(`github`, true, `Github logging`)
	selenium := flag.Bool(`selenium`, false, `Selenium container`)
	domain := flag.String(`domain`, `vibioh.fr`, `Domain name`)
	users := flag.String(`users`, `vibioh:admin|eponae:multi`, `Allowed users list`)
	flag.Parse()

	tmpl, err := template.New(`docker-compose`).Parse(dockerCompose)
	if err != nil {
		log.Printf(`Error while parsing template: %v`, err)
	} else {
		prefixedDomain := `.` + *domain
		if strings.HasPrefix(*domain, `:`) {
			prefixedDomain = *domain
		}

		if err := tmpl.Execute(os.Stdout, arguments{*tls, *auth, *traefik, *prometheus, *github, *selenium, prefixedDomain, *users}); err != nil {
			log.Printf(`Error while rendering template: %v`, err)
		}
	}
}
