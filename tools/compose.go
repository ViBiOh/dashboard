package main

import (
	"encoding/json"
	"flag"
	"log"
	"os"
	"strings"
	"text/template"
)

type arguments struct {
	TLS        bool
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
	authBasic := flag.Bool(`authBasic`, false, `Basic auth`)
	traefik := flag.Bool(`traefik`, true, `Traefik load-balancer`)
	prometheus := flag.Bool(`prometheus`, true, `Prometheus monitoring`)
	github := flag.Bool(`github`, true, `Github logging`)
	selenium := flag.Bool(`selenium`, false, `Selenium container`)
	domain := flag.String(`domain`, `vibioh.fr`, `Domain name`)
	users := flag.String(`users`, `admin:admin`, `Allowed users list`)
	expose := flag.Bool(`expose`, false, `Expose opened ports`)
	flag.Parse()

	funcs := template.FuncMap{
		`merge`: func(o interface{}, newKey string) map[string]interface{} {
			var output map[string]interface{}
			oStr, _ := json.Marshal(o)
			json.Unmarshal(oStr, &output)

			if newKey != `` {
				parts := strings.Split(newKey, `:`)
				output[parts[0]] = parts[1]
			}

			return output
		},
	}

	tmpl := template.Must(template.New(`docker-compose.yml`).Funcs(funcs).ParseFiles(`tools/docker-compose.yml`))

	prefixedDomain := `.` + *domain
	if strings.HasPrefix(*domain, `:`) {
		prefixedDomain = *domain
	}

	if err := tmpl.Execute(os.Stdout, arguments{*tls, *authBasic, *traefik, *prometheus, *github, *selenium, *expose, prefixedDomain, *users}); err != nil {
		log.Printf(`Error while rendering template: %v`, err)
	}
}
