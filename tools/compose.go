package main

import (
	"flag"
	"log"
	"os"
	"strings"
	"text/template"
)

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

	tmpl := template.Must(template.ParseFiles(`tools/docker-compose.yml`))

	prefixedDomain := `.` + *domain
	if strings.HasPrefix(*domain, `:`) {
		prefixedDomain = *domain
	}

	if err := tmpl.Execute(os.Stdout, arguments{*tls, *auth, *authBasic, *traefik, *prometheus, *github, *selenium, *expose, prefixedDomain, *users}); err != nil {
		log.Printf(`Error while rendering template: %v`, err)
	}
}
