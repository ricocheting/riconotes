package storage

import (
	"errors"
	"io/ioutil"
	"os"
	"regexp"
)

const (
	filemode = os.FileMode(0644)
)

var (
	reValidID = regexp.MustCompile(`^\d{4,}$`)
)

func (st *Store) Insert(n *Node) {

}

func (st *Store) Delete() {

}

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
