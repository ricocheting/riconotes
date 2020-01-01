package storage

type Store struct {
	tree      []*Node
	settings  map[string]string
	cachePath string
}

type Node struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Children []*Node `json:"children"`
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

	return st, nil

}

func (st *Store) loadSettings() error {

	return nil
}
