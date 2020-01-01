package main

import (
	"flag"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/ricocheting/riconotes/server"
)

func main() {

	cachePath := flag.String("cache", "./", "Folder where cache files are stored")
	port := flag.String("p", "8080", "Port number to bind to")
	ip := flag.String("ip", "", "IP to bind to")
	debug := flag.Bool("debug", false, "Whether to send CORS headers")

	flag.Parse()

	if !*debug {
		gin.SetMode(gin.ReleaseMode)
	}

	srv, err := server.New(*cachePath)

	if err != nil {
		log.Fatalf("Error opening storage and starting server: %v\n", err)
	}

	srv.Listen(*ip, *port, *debug)
}
