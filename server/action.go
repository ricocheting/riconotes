package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ricocheting/riconotes/storage"
)

func (sv *Server) actionReload(c *gin.Context) {

	if err := sv.store.LoadSettings(); err != nil {
		sv.returnError(c, http.StatusBadRequest, "Could not reload settings", err.Error())
		return
	}

	if err := sv.store.LoadTree(); err != nil {
		sv.returnError(c, http.StatusBadRequest, "Could not reload tree", err.Error())
		return
	}

	payload := struct {
		Tree []*storage.Node `json:"tree"`
	}{
		sv.store.Tree().List(),
	}

	out := Response{
		Code:    http.StatusOK,
		Status:  "success",
		Message: "Successfully reloaded settings and tree",
		Payload: payload,
	}

	c.JSON(http.StatusOK, out)
}
