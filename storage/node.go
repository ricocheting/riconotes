package storage

import (
	"errors"
	"io/ioutil"
	"os"
	"regexp"
)

type Node struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Expand   bool    `json:"expand,omitempty"` // will not have "expand" for false values in json (file or api)
	Children []*Node `json:"children"`
}

const (
	filemode = os.FileMode(0644)
)

var (
	reValidID = regexp.MustCompile(`^\d{4,}$`)
)

/*func (st *Store) Insert(n *Node) {
}*/

/*func (st *Store) Delete() {

}*/

// Update() the node content
func (st *Store) Update(id string, content string) error {
	filename, ok := st.FilePath(id)

	if !ok {
		return errors.New("ID " + id + " is not valid")
	}

	if _, err := os.Stat(filename); os.IsNotExist(err) {
		return errors.New("file " + filename + " does not exist")
	}

	if err := ioutil.WriteFile(filename, []byte(content), filemode); err != nil {
		return err
	}

	return nil
}

// Load() the node content
func (st *Store) Load(id string) (string, error) {
	filename, ok := st.FilePath(id)

	if !ok {
		return "", errors.New("ID " + id + " is not valid")
	}

	// read file
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

// FilePath() for the node
func (st *Store) FilePath(id string) (string, bool) {
	// basic error checking of ID
	if !reValidID.MatchString(id) {
		return "", false
	}

	return st.cachePath + id + ".html", true
}

// FirstChild() of node
func (n *Node) FirstChild() (*Node, bool) {
	for _, node := range n.Children {
		return node, true
	}

	return &Node{}, false
}

func (n *Node) HasChildren() bool {
	return len(n.Children) > 0
}

// ChildIndex() returns int index of id. -1 if not found
func (n *Node) ChildIndex(id string) int {
	for i, node := range n.Children {
		if node.ID == id {
			return i
		}
	}

	return -1
}
