package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ricocheting/riconotes/storage"
)

func (sv *Server) getRoot(c *gin.Context) {
	id := c.DefaultQuery("id", "")

	tree := sv.store.GetTree()

	if len(id) < 1 && len(tree) > 0 && tree[0] != nil && len(tree[0].Children) > 0 && tree[0].Children[0] != nil {
		id = tree[0].Children[0].ID
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
		tree,
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
