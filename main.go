package main

import (
	"flag"

	"github.com/gin-gonic/gin"
	"github.com/ricocheting/riconotes/server"
)

func main() {

	port := flag.String("p", "8080", "Port number to bind to")
	ip := flag.String("ip", "", "IP to bind to")
	debug := flag.Bool("debug", false, "Whether to send CORS headers")

	flag.Parse()

	if !*debug {
		gin.SetMode(gin.ReleaseMode)
	}

	srv := server.New()
	srv.Listen(*ip, *port, *debug)
}
