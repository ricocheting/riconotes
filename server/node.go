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

//putNode() updates content
func (sv *Server) putNode(c *gin.Context) {
	id := c.Param("id")

	type Request struct {
		Content string `json:"content" binding:"required"`
	}

	var req Request

	if err := c.ShouldBindJSON(&req); err != nil {
		sv.returnError(c, http.StatusUnprocessableEntity, "Submitted data did not have the required 'Content' JSON field", err.Error())
		return
	}

	sv.store.Update(id, req.Content)

	payload := struct {
		Content string `json:"content"`
	}{
		req.Content,
	}

	out := Response{
		Code:    http.StatusOK,
		Status:  "success",
		Message: "Successfully updated content node " + id,
		Payload: payload,
	}

	c.JSON(http.StatusOK, out)
}
