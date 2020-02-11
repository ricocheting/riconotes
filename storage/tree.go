package storage

import (
	"sync"
)

type Tree struct {
	nodes []*Node
	mux   sync.RWMutex
}

func (t *Tree) Attach(parentID string, n *Node) bool {
	if parentNode, ok := t.Find(parentID); ok {
		parentNode.Children = append(parentNode.Children, n)
		return true
	}

	return false
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

func (t *Tree) FindParent(id string) (*Node, bool) {
	for _, node := range t.nodes {
		if node.ID == id {
			return node, true
		}

		cNode, cReturn := treeFindParent(id, node)

		if cReturn {
			return cNode, cReturn
		}
	}

	return &Node{}, false
}
func treeFindParent(id string, parent *Node) (*Node, bool) {

	for _, node := range parent.Children {
		if node.ID == id {
			return parent, true
		}

		// crawl if node has children
		idReturn, cReturn := &Node{}, false
		if node.HasChildren() {
			idReturn, cReturn = treeFindParent(id, node)
		}

		if cReturn {
			return idReturn, cReturn
		}
	}

	return &Node{}, false
}

// param: node id
// returns: bool if successful
// note: if moving, Attach new before Detach old
func (t *Tree) Detach(id string) bool {

	if parentNode, ok := t.FindParent(id); ok {
		//fmt.Printf("found parent %v\n", parentNode)

		if i := parentNode.ChildIndex(id); i > -1 {
			copy(parentNode.Children[i:], parentNode.Children[i+1:])
			parentNode.Children[len(parentNode.Children)-1] = nil
			parentNode.Children = parentNode.Children[:len(parentNode.Children)-1]
			return true
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
