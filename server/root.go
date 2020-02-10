package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ricocheting/riconotes/storage"
)

func (sv *Server) getRoot(c *gin.Context) {
	id := c.DefaultQuery("id", "")

	tree := sv.store.Tree()

	if len(id) < 1 && !tree.Empty() {
		if node, ok := tree.First(); ok {
			if cNode, cOK := node.FirstChild(); cOK {
				id = cNode.ID
			}
		}
	}

	var (
		content string = ""
		err     error
	)

	if len(id) > 0 {
		content, err = sv.store.Load(id)
	}

	if err != nil {
		sv.returnError(c, http.StatusNotFound, "Node ID was not found in database: "+id, err.Error())
		return
	}

	payload := struct {
		Tree    []*storage.Node `json:"tree"`
		Content string          `json:"content"`
	}{
		tree.List(),
		content,
	}

	out := Response{
		Code:    http.StatusOK,
		Status:  "success",
		Message: "Successfully listed tree",
		Payload: payload,
	}

	c.JSON(http.StatusOK, out)
}
