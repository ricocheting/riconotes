package storage

import (
	"sync"
)

type Tree struct {
	nodes []*Node
	mux   sync.RWMutex
}

func (t *Tree) Attach(parentID string, n Node) bool {

	return true
}

// desc: crawls tree and returns pointer to the node to edit
// param: id to find
// returns: pointer to node, bool if found
func (t *Tree) Find(id string) (*Node, bool) {
	return treeFind(id, t.nodes)
}
func treeFind(id string, children []*Node) (*Node, bool) {

	for _, node := range children {
		if node.ID == id {
			return node, true
		}

		// crawl if node has children
		idReturn, cReturn := &Node{}, false
		if node.HasChildren() {
			idReturn, cReturn = treeFind(id, node.Children)
		}

		if cReturn {
			return idReturn, cReturn
		}
	}

	return &Node{}, false
}

// param: node id
// returns: bool if successful
// note: if moving, attach new before detach old. "Safe" to call as it won't work if node has children
func (t *Tree) Detach(id string) bool {

	return treeDetach(id, t.nodes)
}

// return bool if found
func treeDetach(id string, children []*Node) bool {

	for _, node := range children {
		if node.ID == id {
			// todo: unset(children[key])
			return true
		}

		// crawl if node has children
		cReturn := false
		if node.HasChildren() {
			cReturn = treeDetach(id, node.Children)
		}

		if cReturn {
			// todo: reindex node.children if needed
			return cReturn
		}
	}

	return false
}

// param: node id
// returns: bool
func (t *Tree) HasChildren(id string) bool {
	t.mux.RLock()
	defer t.mux.RUnlock()

	if node, ok := t.Find(id); ok {
		return node.HasChildren()
	}

	return false
}
func (t *Tree) Empty() bool {
	t.mux.RLock()
	out := len(t.nodes) < 1
	t.mux.RUnlock()

	return out
}
func (t *Tree) First() (*Node, bool) {
	t.mux.RLock()
	defer t.mux.RUnlock()

	for _, node := range t.nodes {
		return node, true
	}

	return &Node{}, false
}

func (t *Tree) List() []*Node {
	t.mux.RLock()
	nodes := t.nodes
	t.mux.RUnlock()

	return nodes
}
