package main

import (
	"github.com/ViBiOh/dashboard/httpclient"
	"log"
	"net/http"
)

func main() {
	if statusCode, err := httpclient.GetStatusCode(`http://localhost:1080/health`); err != nil {
		log.Fatal(err)
	} else if statusCode != http.StatusOK {
		log.Fatalf(`HTTP/%d`, statusCode)
	}

	log.Print(`Health succeed`)
}
