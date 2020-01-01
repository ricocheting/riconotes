package server

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func (sv *Server) getRoot(c *gin.Context) {

	out := Response{
		Code:        http.StatusCreated,
		Status:      "success",
		Message:     "Successfully saved",
		Description: "Successfully inserted new Comment ID: ",
	}

	c.JSON(http.StatusCreated, out)
}
