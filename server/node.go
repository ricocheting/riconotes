package server

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func (sv *Server) getNode(c *gin.Context) {
	id := c.Param("id")

	node, err := sv.store.Load(id)

	if err != nil {
		sv.returnError(c, http.StatusNotFound, "Node ID was not found in database: "+id, err.Error())
		return
	}

	out := Response{
		Code:    http.StatusOK,
		Status:  "success",
		Message: "Successfully retrieved node " + id,
		Payload: node,
	}

	c.JSON(http.StatusOK, out)
}
