package storage

import (
	"encoding/json"
	"io/ioutil"
	"sync"
)

const (
	SETTINGSFILE = "_settings.json"
	TREEFILE     = "_tree.json"
)

type Store struct {
	tree      *Tree
	settings  *Settings
	cachePath string //include trailing slash

	mux sync.RWMutex
}

type Settings struct {
	NextID int64 `json:"nextID"`
}

// New instance of Store. load the tree and the settings from the flat files
func New(cachePath string) (*Store, error) {

	st := &Store{
		cachePath: cachePath,
	}

	if err := st.loadTree(); err != nil {
		return st, err
	}

	if err := st.loadSettings(); err != nil {
		return st, err
	}

	return st, nil
}

func (st *Store) loadSettings() error {

	// read file
	data, err := ioutil.ReadFile(st.cachePath + SETTINGSFILE)
	if err != nil {
		return err
	}

	// unmarshall it into Store.settings
	err = json.Unmarshal(data, &st.settings)
	if err != nil {
		return err
	}

	return nil
}

func (st *Store) loadTree() error {

	// read file
	data, err := ioutil.ReadFile(st.cachePath + TREEFILE)
	if err != nil {
		return err
	}

	if st.tree == nil {
		st.tree = &Tree{}
	}

	// unmarshall it into Store.tree.nodes
	err = json.Unmarshal(data, &st.tree.nodes)
	if err != nil {
		return err
	}

	return nil
}

//SaveTree to json flat file
func (st *Store) SaveTree() error {
	st.mux.RLock()
	defer st.mux.RUnlock()

	file, err := json.MarshalIndent(st.tree.List(), "", "\t")
	if err != nil {
		return err
	}

	if err := ioutil.WriteFile(st.cachePath+TREEFILE, file, filemode); err != nil {
		return err
	}

	return nil
}

// return the Tree
func (st *Store) Tree() *Tree {
	st.mux.RLock()
	tree := st.tree
	st.mux.RUnlock()

	return tree
}
