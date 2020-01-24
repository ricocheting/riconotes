package storage

import (
	"errors"
	"io/ioutil"
	"regexp"
)

var (
	reValidID = regexp.MustCompile(`^\d{4,}$`)
)

func (st *Store) Insert(n *Node) {

}

func (st *Store) Delete() {

}

func (st *Store) Update() {

}

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

func (st *Store) FilePath(id string) (string, bool) {
	// basic error checking of ID
	if !reValidID.MatchString(id) {
		return "", false
	}

	return st.cachePath + id + ".html", true
}
