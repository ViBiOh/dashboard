package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"text/template"
)

type arguments struct {
	TLS        bool
	AuthBasic  bool
	Traefik    bool
	Github     bool
	Selenium   bool
	Expose     bool
	Domain     string
	Users      string
	Tag        string
	Version    string
	DockerUser bool
	Tracing    bool
}

func main() {
	tls := flag.Bool(`tls`, true, `TLS for all containers`)
	authBasic := flag.Bool(`authBasic`, false, `Basic auth`)
	traefik := flag.Bool(`traefik`, true, `Traefik load-balancer`)
	github := flag.Bool(`github`, true, `Github logging`)
	selenium := flag.Bool(`selenium`, false, `Selenium container`)
	domain := flag.String(`domain`, `vibioh.fr`, `Domain name`)
	users := flag.String(`users`, `admin:admin`, `Allowed users list`)
	tag := flag.String(`tag`, ``, `Docker tag used`)
	version := flag.String(`version`, ``, `Docker image version`)
	expose := flag.Bool(`expose`, false, `Expose opened ports`)
	dockerUser := flag.Bool(`user`, false, `Enable docker user default`)
	tracing := flag.Bool(`tracing`, false, `Enable opentracing`)
	flag.Parse()

	funcs := template.FuncMap{
		`merge`: func(o interface{}, newKey string) map[string]interface{} {
			var output map[string]interface{}
			oStr, _ := json.Marshal(o)
			if err := json.Unmarshal(oStr, &output); err != nil {
				log.Printf(`Error while unmarshalling content: %v`, err)
			}

			if newKey != `` {
				parts := strings.Split(newKey, `:`)
				output[parts[0]] = parts[1]
			}

			return output
		},
	}

	tmpl := template.Must(template.New(`docker-compose.yml.html`).Funcs(funcs).ParseFiles(`templates/docker-compose.yml.html`))

	prefixedDomain := fmt.Sprintf(`.%s`, *domain)
	if strings.HasPrefix(*domain, `:`) {
		prefixedDomain = *domain
	}

	if err := tmpl.Execute(os.Stdout, arguments{*tls, *authBasic, *traefik, *github, *selenium, *expose, prefixedDomain, *users, *tag, *version, *dockerUser, *tracing}); err != nil {
		log.Printf(`Error while rendering template: %v`, err)
	}
}
