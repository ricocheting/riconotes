package storage

func (st *Store) loadTree() error {

	return nil
}

func (st *Store) saveTree() error {

	return nil
}

func (st *Store) Attach(parentID string, n Node) bool {

	return true
}

// desc: crawls _tree and returns pointer to the node to edit
// param: id to find
// returns: pointer to node, false on not found
func (st *Store) Find(id string, children []*Node) (*Node, bool) {

	return &Node{}, true
}

// desc: crawls _tree and deletes the node matching the id
// param: id to remove
// returns: bool if found
func (st *Store) prune(id string, children []*Node) bool {

	return true
}

// param: node id
// returns: bool if successful
// note: if moving, attach new before detach old. "Safe" to call as it won't work if node has children
func (st *Store) Detach(id string) bool {

	return true
}

// param: node id
// returns: bool
func (st *Store) HasChildren(id string) bool {

	return true
}
