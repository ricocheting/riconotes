package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (sv *Server) getNode(c *gin.Context) {
	id := c.Param("id")

	// check if it was in tree
	if _, ok := sv.store.Tree().Find(id); !ok {
		sv.returnError(c, http.StatusNotFound, "Node ID does not exist (Invalid): "+id, "")
		return
	}

	// node exists, but content file might not
	node, err := sv.store.Load(id)

	out := Response{
		Code:    http.StatusOK,
		Status:  "success",
		Message: "Successfully retrieved node: " + id,
		Payload: node,
	}

	if err != nil {
		out.Message = "Node exists, but was blank: " + id
	}

	c.JSON(http.StatusOK, out)
}

//putNode() replaces node content
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

//patchNode() updates node (expand or title)
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
	tree := sv.store.Tree()

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
		Message: "Successfully updated node " + id,
		Payload: sv.store.Tree().List(),
	}

	c.JSON(http.StatusOK, out)
}

func (sv *Server) deleteNode(c *gin.Context) {
	id := c.Param("id")

	// check if it was in tree
	node, ok := sv.store.Tree().Find(id)
	if !ok {
		sv.returnError(c, http.StatusNotFound, "Node ID does not exist (Invalid): "+id, "")
		return
	} else if node.HasChildren() {
		sv.returnError(c, http.StatusBadRequest, "Node has children. Can not delete: "+id, "")
		return
	}

	if ok := sv.store.Tree().Detach(id); !ok {
		sv.returnError(c, http.StatusBadRequest, "There was a problem detaching the node: "+id, "")
		return
	}

	//sv.store.SaveTree()

	// TODO: delete the content file (if it exists)

	out := Response{
		Code:    http.StatusOK,
		Status:  "success",
		Message: "Successfully detaching node: " + id,
		Payload: sv.store.Tree().List(),
	}

	c.JSON(http.StatusOK, out)
}
