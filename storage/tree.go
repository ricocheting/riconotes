package storage

import (
	"encoding/json"
	"io/ioutil"
)

type Tree struct {
	nodes []*Node
}

type Node struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Expand   bool    `json:"expand,omitempty"` // will not have "expand" for false values in json (file or api)
	Children []*Node `json:"children"`
}

func (st *Store) loadTree() error {

	// read file
	data, err := ioutil.ReadFile(st.cachePath + TREEFILE)
	if err != nil {
		return err
	}

	// unmarshall it into Store
	err = json.Unmarshal(data, &st.tree)
	if err != nil {
		return err
	}

	return nil
}

func (st *Store) saveTree() error {

	return nil
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
	if node, ok := t.Find(id); ok {
		return node.HasChildren()
	}

	return false
}

func (n *Node) HasChildren() bool {
	return len(n.Children) > 0
}

func (st *Store) GetTree() *Tree {
	st.mux.RLock()
	tree := st.tree
	st.mux.RUnlock()

	return tree
}
