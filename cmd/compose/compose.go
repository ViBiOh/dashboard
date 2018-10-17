package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"
	"text/template"

	"github.com/ViBiOh/httputils/pkg/logger"
)

type arguments struct {
	AuthBasic   bool
	DockerUser  bool
	Domain      string
	Environment string
	Expose      bool
	Github      bool
	Mailer      bool
	Rollbar     bool
	Selenium    bool
	Tag         string
	TLS         bool
	Tracing     bool
	Traefik     bool
	Users       string
	Version     string
}

func main() {
	flagArgs := map[string]interface{}{
		`AuthBasic`:   flag.Bool(`authBasic`, false, `Basic auth`),
		`DockerUser`:  flag.Bool(`user`, false, `Enable docker user default`),
		`Domain`:      flag.String(`domain`, `vibioh.fr`, `Domain name`),
		`Environment`: flag.String(`environment`, `prod`, `Environment`),
		`Expose`:      flag.Bool(`expose`, false, `Expose opened ports`),
		`Github`:      flag.Bool(`github`, true, `Github logging`),
		`Mailer`:      flag.Bool(`mailer`, true, `Enable mailer`),
		`Rollbar`:     flag.Bool(`rollbar`, true, `Rollbar error reporting`),
		`Selenium`:    flag.Bool(`selenium`, false, `Selenium container`),
		`Tag`:         flag.String(`tag`, ``, `Docker tag used`),
		`TLS`:         flag.Bool(`tls`, true, `TLS for all containers`),
		`Tracing`:     flag.Bool(`tracing`, true, `Enable opentracing`),
		`Traefik`:     flag.Bool(`traefik`, true, `Traefik load-balancer`),
		`Users`:       flag.String(`users`, `admin:admin`, `Allowed users list`),
		`Version`:     flag.String(`version`, ``, `Docker image version`),
	}
	flag.Parse()

	var args arguments

	if content, err := json.Marshal(flagArgs); err != nil {
		logger.Error(`error while marshalling flags: %v`, err)
		return
	} else if err := json.Unmarshal(content, &args); err != nil {
		logger.Error(`error while unmarshalling flags: %v`, err)
		return
	}

	funcs := template.FuncMap{
		`merge`: func(o interface{}, newKey string) map[string]interface{} {
			var output map[string]interface{}
			oStr, _ := json.Marshal(o)
			if err := json.Unmarshal(oStr, &output); err != nil {
				logger.Error(`error while unmarshalling content: %v`, err)
			}

			if newKey != `` {
				parts := strings.Split(newKey, `:`)
				output[parts[0]] = parts[1]
			}

			return output
		},
	}

	tmpl := template.Must(template.New(`docker-compose.yml.html`).Funcs(funcs).ParseFiles(`templates/docker-compose.yml.html`))

	if !strings.HasPrefix(args.Domain, `:`) {
		args.Domain = fmt.Sprintf(`.%s`, args.Domain)
	}

	if err := tmpl.Execute(os.Stdout, args); err != nil {
		logger.Error(`error while rendering template: %v`, err)
	}
}
