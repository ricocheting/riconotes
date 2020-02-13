package storage

import (
	"sync"
)

type Tree struct {
	nodes []*Node
	mux   sync.RWMutex
}

func (t *Tree) Attach(parentID string, n *Node) bool {
	t.mux.Lock()
	defer t.mux.Unlock()

	if node, _ := t.find(parentID); node != nil {
		node.Children = append(node.Children, n)
		return true
	}

	return false
}

func (t *Tree) CreateParent(n *Node) bool {
	t.mux.Lock()
	t.nodes = append(t.nodes, n)
	t.mux.Unlock()

	return true
}

// Find() returns: pointer to node, bool if found
func (t *Tree) Find(id string) (*Node, bool) {
	t.mux.RLock()
	node, _ := t.find(id)
	t.mux.RUnlock()

	return node, node != nil
}

// find() returns: (node, parent) node may be nil if not found. parent will be nil if node is top parent. no locking
func (t *Tree) find(id string) (*Node, *Node) {
	for _, node := range t.nodes {
		if node.ID == id {
			return node, nil
		}

		nReturn, pReturn := nfind(id, node)

		if nReturn != nil {
			return nReturn, pReturn
		}
	}

	return nil, nil
}

// nfind() returns: (node, parent) both will be nil if not found
func nfind(id string, parent *Node) (*Node, *Node) {

	for _, node := range parent.Children {
		if node.ID == id {
			return node, parent
		}

		// crawl if node has children
		var nReturn *Node = nil
		var pReturn *Node = nil
		if node.HasChildren() {
			nReturn, pReturn = nfind(id, node)
		}

		if nReturn != nil || pReturn != nil {
			return nReturn, pReturn
		}
	}

	return nil, nil
}

func (t *Tree) Detach(id string) bool {
	t.mux.Lock()
	defer t.mux.Unlock()

	node, parent := t.find(id)

	if parent != nil {
		// has parent, remove from parent.Children

		if i := parent.ChildIndex(id); i > -1 {
			copy(parent.Children[i:], parent.Children[i+1:])
			parent.Children[len(parent.Children)-1] = nil
			parent.Children = parent.Children[:len(parent.Children)-1]
			return true
		}

	} else if node != nil {
		// node found, but no parent. try remove directly from tree

		for i, node := range t.nodes {
			if node.ID == id {
				copy(t.nodes[i:], t.nodes[i+1:])
				t.nodes[len(t.nodes)-1] = nil
				t.nodes = t.nodes[:len(t.nodes)-1]
				return true
			}
		}
	}

	return false
}

func (t *Tree) HasChildren(id string) bool {
	t.mux.RLock()
	defer t.mux.RUnlock()

	if node, _ := t.find(id); node != nil {
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
