package storage

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
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

// New instance of Store. load the tree and the settings from the flat files
func New(cachePath string, init bool) (*Store, error) {

	st := &Store{
		cachePath: cachePath,
	}

	existsSettings := st.ExistsSettings()
	existsTree := st.ExistsTree()

	if !existsSettings || !existsTree {
		if init {
			if !existsSettings {
				st.settings = &Settings{NextID: 1}
				st.SaveSettings()
			}
			if !existsTree {
				st.tree = &Tree{nodes: []*Node{}}
				tabID := st.Settings().GetID()
				st.Settings().IncrementID()
				childID := st.Settings().GetID()
				st.Settings().IncrementID()

				nodeTab := &Node{
					ID:    tabID,
					Title: "Tab " + tabID,
					Children: []*Node{&Node{
						ID:       childID,
						Title:    "Item " + childID,
						Children: []*Node{},
					}},
				}

				// try to attach new node to parent
				if ok := st.Tree().CreateParent(nodeTab); ok {
					st.SaveSettings()
					st.SaveTree()
				} else {
					return st, fmt.Errorf("could not initilize tree")
				}
			}

		} else {
			return st, fmt.Errorf("json files " + st.cachePath + SETTINGSFILE + " or " + st.cachePath + TREEFILE + " do not exist. provide the correct -cache=\"\" path or run with -init")
		}
	}

	if err := st.LoadTree(); err != nil {
		return st, err
	}

	if err := st.LoadSettings(); err != nil {
		return st, err
	}

	return st, nil
}

func (st *Store) LoadSettings() error {
	st.mux.Lock()
	defer st.mux.Unlock()

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

//SaveSettings to json flat file
func (st *Store) SaveSettings() error {
	st.mux.RLock()
	defer st.mux.RUnlock()

	file, err := json.MarshalIndent(st.settings, "", "")
	if err != nil {
		return err
	}

	if err := ioutil.WriteFile(st.cachePath+SETTINGSFILE, file, filemode); err != nil {
		return err
	}

	return nil
}

func (st *Store) ExistsSettings() bool {
	if _, err := os.Stat(st.cachePath + SETTINGSFILE); os.IsNotExist(err) {
		return false
	}
	return true
}

func (st *Store) ExistsTree() bool {
	if _, err := os.Stat(st.cachePath + TREEFILE); os.IsNotExist(err) {
		return false
	}
	return true
}

func (st *Store) LoadTree() error {
	st.mux.RLock()
	defer st.mux.RUnlock()

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

// return the Settings
func (st *Store) Settings() *Settings {
	st.mux.RLock()
	settings := st.settings
	st.mux.RUnlock()

	return settings
}
