package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
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

//putNode() updates tree content (expanded, title)
func (sv *Server) patchNode(c *gin.Context) {
	id := c.Param("id")

	type Request struct {
		Expand *bool  `json:"expand"` // if (req.Expand == nil) it wasn't submitted/doesn't need changed
		Title  string `json:"title"`
	}

	var req Request

	if err := c.ShouldBindJSON(&req); err != nil {
		sv.returnError(c, http.StatusUnprocessableEntity, "Submitted data did not have the required JSON fields", err.Error())
		return
	}

	if len(req.Title) < 1 && req.Expand == nil {
		sv.returnError(c, http.StatusUnprocessableEntity, "Submitted data did not have the required JSON fields", "Need 'expand' or 'title' fields")
		return
	}
	// update the tree node as necessary
	tree := sv.store.GetTree()

	if node, ok := tree.Find(id); ok {
		if len(req.Title) > 1 {
			node.Title = req.Title
		}
		if req.Expand != nil {
			node.Expand = *req.Expand
		}
	}

	sv.store.SaveTree()

	//fmt.Printf("%t = %v = %v\n", (req.Expanded != nil), req.Expanded, req.Title)

	out := Response{
		Code:    http.StatusOK,
		Status:  "success",
		Message: "Successfully updated content node " + id,
		Payload: "payload",
	}

	c.JSON(http.StatusOK, out)
}
