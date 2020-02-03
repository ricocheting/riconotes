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
	tree      *Tree
	settings  *Settings
	cachePath string //include trailing slash

	//mux sync.RWMutex
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

	if err := st.LoadTree(); err != nil {
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

func (st *Store) LoadTree() error {

	// read file
	data, err := ioutil.ReadFile(st.cachePath + TREEFILE)
	if err != nil {
		return err
	}

	if st.tree == nil {
		st.tree = &Tree{}
	}

	// unmarshall it into Store
	err = json.Unmarshal(data, &st.tree.nodes)
	if err != nil {
		return err
	}

	return nil
}

func (st *Store) SaveTree() error {
	// todo: this def needs lock

	file, err := json.MarshalIndent(st.tree.List(), "", "")
	if err != nil {
		return err
	}

	if err := ioutil.WriteFile(st.cachePath+TREEFILE, file, filemode); err != nil {
		return err
	}

	return nil
}
