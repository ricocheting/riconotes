package storage

import (
	"fmt"
	"sync"
)

type Settings struct {
	NextID int64 `json:"nextID"`
	mux    sync.RWMutex
}

func (s *Settings) IncrementID() {
	s.mux.Lock()
	s.NextID = s.NextID + 1
	s.mux.Unlock()
}
func (s *Settings) GetID() (nextID string) {
	s.mux.RLock()
	nextID = fmt.Sprintf("%04d", s.NextID)
	s.mux.RUnlock()
	return
}
