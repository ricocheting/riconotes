package storage

import (
	"encoding/json"
	"io/ioutil"
)

const (
	SETTINGSFILE = "_settings.json"
	TREEFILE     = "_tree.json"
)

type Store struct {
	tree      []*Node
	settings  *Settings
	cachePath string //include trailing slash
}

type Node struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Children []*Node `json:"children"`
}

type Settings struct {
	NextID int64 `json:"nextID"`
}

// New instance of Server. Starts bolt
func New(cachePath string) (*Store, error) {

	// load the tree and the settings from the flat files

	st := &Store{
		cachePath: cachePath,
	}

	if err := st.loadTree(); err != nil {
		return st, err
	}

	if err := st.loadSettings(); err != nil {
		return st, err
	}

	// for _, node := range st.tree {
	// 	fmt.Printf("node: %v\n", node)
	// }

	return st, nil
}

func (st *Store) loadSettings() error {

	// read file
	data, err := ioutil.ReadFile(st.cachePath + SETTINGSFILE)
	if err != nil {
		return err
	}

	// unmarshall it into Store
	err = json.Unmarshal(data, &st.settings)
	if err != nil {
		return err
	}

	return nil
}
