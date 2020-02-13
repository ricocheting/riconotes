package main

import (
	"flag"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/ricocheting/riconotes/server"
)

func main() {

	cachePath := flag.String("cache", "./", "Folder where cache files are stored")
	port := flag.String("port", "9000", "Port number to bind to")
	ip := flag.String("ip", "", "IP to bind to")
	debug := flag.Bool("debug", false, "Whether to send CORS headers")
	init := flag.Bool("init", false, "Setup the initial json files (if they do not exist)")

	flag.Parse()

	if !*debug {
		gin.SetMode(gin.ReleaseMode)
	}

	srv, err := server.New(*cachePath, *init)

	if err != nil {
		log.Fatalf("Error opening storage and starting server: %v\n", err)
	}

	srv.Listen(*ip, *port, *debug)
}
