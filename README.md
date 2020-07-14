This is a project so I have a local and easy-to-retrieve note library. The front end is in react (so loadable in the browser). The backend is an http server written in golang and accessable using a REST API. The settings are stored in `*.json` and the actual notes are stored in `*.md` files.

The notes format support markdown and are organized into a tree.

### Favicon
http://www.iconarchive.com/show/farm-fresh-icons-by-fatcow/document-notes-icon.html


# TODO
* replace any occurance of searchTree() with nfind() in App.js
* rewrite entire App.js to use a "tree" object with a function to find node, parent, update node or parts of node
