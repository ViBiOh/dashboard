package deploy

import "errors"

var errHealthCheckFailed = errors.New("health check failed")

type dockerComposeHealthcheck struct {
	Test     []string
	Interval string
	Timeout  string
	Retries  int
}

type dockerComposeService struct {
	Image         string
	Command       []string
	Environment   map[string]string
	Labels        map[string]string
	Ports         []string
	Links         []string
	ExternalLinks []string `yaml:"external_links"`
	Volumes       []string
	DNS           []string
	CapAdd        []string `yaml:"cap_add"`
	SecurityOpt   []string `yaml:"security_opt"`
	Hostname      string
	User          string
	GroupAdd      []string `yaml:"group_add"`
	Healthcheck   *dockerComposeHealthcheck
	ReadOnly      bool  `yaml:"read_only"`
	CPUShares     int64 `yaml:"cpu_shares"`
	MemoryLimit   int64 `yaml:"mem_limit"`
}

type dockerCompose struct {
	Version  string
	Services map[string]dockerComposeService
}

type deployedService struct {
	Name        string   `json:"name"`
	FullName    string   `json:"fullname"`
	ContainerID string   `json:"containerId"`
	ImageName   string   `json:"imageName"`
	Logs        []string `json:"logs"`
	HealthLogs  []string `json:"healthLogs"`
	State       string   `json:"state"`
}

type deployNotification struct {
	App      string            `json:"app"`
	URL      string            `json:"url"`
	Success  bool              `json:"success"`
	Services []deployedService `json:"services"`
}
