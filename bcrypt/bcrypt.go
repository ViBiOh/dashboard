package main

import (
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := os.Args[1]
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		log.Printf(`Error: %v`, err)
	}
	log.Print(`password=` + password)
	log.Print(`hash=` + string(hash))
}
