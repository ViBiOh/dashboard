package deploy

import "errors"

var errHealthCheckFailed = errors.New(`Health check failed`)

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
	Hostname      string
	User          string
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
	ContainerID string   `json:"containerID"`
	ImageName   string   `json:"imageName"`
	Logs        []string `json:"logs"`
	State       string   `json:"state"`
}

type deployNotification struct {
	App      string            `json:"app"`
	URL      string            `json:"url"`
	Success  bool              `json:"success"`
	Services []deployedService `json:"services"`
}
