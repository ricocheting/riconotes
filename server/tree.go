package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ricocheting/riconotes/storage"
)

func (sv *Server) getTree(c *gin.Context) {
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
		// check if id is for a Tab. if it is a tab id, try to get content for first child node
		if !tree.HasParent(id) {
			if node, ok := tree.Find(id); ok {
				if nodeFirst, ok := node.FirstChild(); ok {
					content, err = sv.store.Load(nodeFirst.ID)
				}
			}
		} else {
			content, err = sv.store.Load(id)
		}
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

	if err != nil {
		out.Message = "Default Node ID was not found in database: " + id
	}

	c.JSON(http.StatusOK, out)
}

func (sv *Server) insertTreeChild(c *gin.Context) {
	parentID := c.Param("id")

	// get next available ID
	nextID := sv.store.Settings().GetID()

	//attach it to the parent
	node := &storage.Node{
		ID:       nextID,
		Title:    "New Node " + nextID,
		Children: []*storage.Node{},
	}

	// try to attach new node to parent
	if ok := sv.store.Tree().Attach(parentID, node); ok {
		// increment the next available ID and save settings file
		sv.store.Settings().IncrementID()
		sv.store.SaveSettings()

		// save the tree changes
		sv.store.SaveTree()
	} else {
		sv.returnError(c, http.StatusBadRequest, "New node could not be attached to parent "+parentID+". Invalid ParentID?", "")
		return
	}

	payload := struct {
		Tree     []*storage.Node `json:"tree"`
		NodeTree *storage.Node   `json:"node"`
	}{
		sv.store.Tree().List(),
		node,
	}

	out := Response{
		Code:    http.StatusOK,
		Status:  "success",
		Message: "Child node added to " + parentID + "",
		Payload: payload,
	}

	c.JSON(http.StatusOK, out)
}

func (sv *Server) insertTreeParent(c *gin.Context) {

	// get next available ID
	nextID := sv.store.Settings().GetID()

	//attach it to the parent
	node := &storage.Node{
		ID:       nextID,
		Title:    "New Parent " + nextID,
		Children: []*storage.Node{},
	}

	// try to create parent
	if ok := sv.store.Tree().CreateParent(node); ok {
		// increment the next available ID and save settings file
		sv.store.Settings().IncrementID()
		sv.store.SaveSettings()

		// save the tree changes
		sv.store.SaveTree()
	} else {
		sv.returnError(c, http.StatusBadRequest, "New parent node could not created.", "")
		return
	}

	payload := struct {
		Tree     []*storage.Node `json:"tree"`
		NodeTree *storage.Node   `json:"node"`
	}{
		sv.store.Tree().List(),
		node,
	}

	out := Response{
		Code:    http.StatusOK,
		Status:  "success",
		Message: "Parent node added",
		Payload: payload,
	}

	c.JSON(http.StatusOK, out)
}
