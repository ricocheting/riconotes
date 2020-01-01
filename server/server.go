package server

import (
	"mime"
	"net/http"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ricocheting/riconotes/storage"
)

// Server represents the all the listening urls
type Server struct {
	store *storage.Store
	r     *gin.Engine
}

// New instance of Server. Starts bolt
func New(cachePath string) (*Server, error) {
	st, err := storage.New(cachePath)

	return &Server{
		store: st,
		r:     gin.Default(),
	}, err
}

//ReturnJSON is the "message" object that is returned
type Response struct {
	Code        int         `json:"code"`                  //200,400,401,403,404,500
	Status      string      `json:"status"`                //[error,success,warning]
	Message     string      `json:"message"`               //short message that is safe to display to the user
	Description string      `json:"description,omitempty"` //longer message that is for API developer use only
	Payload     interface{} `json:"payload,omitempty"`     // if we need to return an object. like the updated object on POST. turn it into JSON before assignint it here
}

func (sv *Server) returnError(c *gin.Context, httpCode int, message string, description string) {
	out := Response{
		Code:        httpCode,
		Status:      "error",
		Message:     message,
		Description: description,
	}

	c.JSON(httpCode, out)
	c.Abort()
}

// Listen on the specific port and IP. If blank IP, listens on all
func (sv *Server) Listen(ip string, port string, debug bool) {

	// gin
	r := sv.r

	// allow cross-domain access if -debug flag was used
	// - config.AllowAllOrigins = true
	// - GET, POST, PUT, DELETE methods
	// - Credentials share disabled
	// - Preflight requests cached for 12 hours
	if debug {
		config := cors.DefaultConfig()
		config.AllowAllOrigins = true
		config.AllowMethods = []string{"GET", "POST", "PATCH", "DELETE"}
		r.Use(cors.New(config))
	}

	// list tree
	r.GET("/", sv.getRoot)

	// addParentNode
	r.POST("/", sv.checkContentType)

	// addChildNode
	r.POST("/:id/child")

	// display node
	r.GET("/:id")
	// remove node
	r.DELETE("/:id")
	// update node (title or expanded)
	r.PATCH("/:id")

	r.Run(ip + ":" + port) // listen and serve
}

// checkContentType() makes sure the request (usually POST or PUT) data is "Content-Type: application/json; charset=utf-8"
func (sv *Server) checkContentType(ctx *gin.Context) {
	contentType := strings.ToLower(ctx.Request.Header.Get("Content-Type"))
	var valid = false

	if contentType != "" {
		for _, v := range strings.Split(contentType, ",") {
			t, _, err := mime.ParseMediaType(v)
			if err != nil {
				break
			}
			if t == "application/json" {
				valid = true
				break
			}
		}
	}

	if !valid {
		sv.returnError(ctx, http.StatusUnsupportedMediaType, "415 Unsupported Media Type", "Request must be Content-Type:application/JSON encoded")
	}
}
