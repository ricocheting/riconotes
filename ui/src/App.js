import React, { Component } from "react";
import Content from "./Content";
import Api from "./Api";

import Tabs from "./Tabs";
import TreeChildren from "./Tree";
import EditBar from "./EditBar";
import { Row, Col, Icon, Button, message } from "antd";
const ButtonGroup = Button.Group;

/*

when you want to move the folder: delete node_modules, move the folder, then run npm install in it

npx create-react-app react-tutorial
cd react-tutorial
npm start

	https://ant.design/components/tabs/

	import 'antd/dist/antd.css';

npm run build

*/

let defaultExpandedKeys = [];

class App extends Component {
	state = {
		masterTree: [], //{id: "1", title: "Title One", children: [{tree},{tree}]}
		activeTabID: null,
		activeTreeID: null,
		content: "",
	};

	// Code is invoked after the component is mounted/inserted into the DOM tree.
	// React lifecycle method. Lifecycle is the order in which methods are called in React. Mounting refers to an item being inserted into the DOM.
	// When we pull in API data, we want to use componentDidMount, because we want to make sure the component has rendered to the DOM before we bring in the data
	async componentDidMount() {
		window.addEventListener("hashchange", this.handleNewHash, false);

		const result = await Api.getTree();

		if (result.status === "success") {
			this.expandedKeys(result.payload.tree);
			let activeTabID = null,
				activeTreeID = null,
				content = "",
				callback = null;

			// see if there was hash set
			var location = window.location.hash.replace(/^#\/?|\/$/g, "").split("/"); //hash looks like #1/0002/Quicktext
			if (location.length > 0 && location[0].length > 0) {
				// if we pulled a TabID
				activeTabID = location[0];
				callback = this.displayNodeHash(location[1]); // display the content for this activeTreeID
			} else if (result.payload.tree.length > 0) {
				// default to the first tab
				// default to the first tab
				if (result.payload.tree[0].children.length > 0) {
					activeTreeID = result.payload.tree[0].children[0].id;
				}

				activeTabID = result.payload.tree[0].id;
				content = result.payload.content;
			}

			this.setState(
				{ masterTree: result.payload.tree, activeTabID: activeTabID, activeTreeID: activeTreeID, content: content },
				() => callback
			);
		} else {
			message.error(result.message);
		}
	}

	//#######################################
	// check if the ID is valid. if yes, update the hash
	displayNode = (id) => {
		if (!id || typeof id === "undefined" || id === undefined) {
			this.setState({ activeTreeID: null, content: "" });
			return;
		} else if (Array.isArray(id)) {
			// the Tree.onSelect() can return multiple ids so it gives back an array. we only care about the first
			id = id[0];
		}

		let title = "";
		this.state.masterTree.map((node, key) => {
			let matched = this.searchTree(node, id);

			if (matched !== null) {
				title = matched.title
					.replace(/[^a-z0-9]/gi, "-")
					.replace(/-+/gi, "-")
					.replace(/^-|-$/gi, "");
			}

			return null;
		});

		// change the location. which triggers the handleNewHash() listener assigned in componentDidMount() which triggers displayNodeHash()
		window.location.href = window.location.href.replace(/#(.*)$/, "") + "#" + this.state.activeTabID + "/" + id + "/" + title;
	};

	// query the API to pull the content for this ID
	displayNodeHash = async (id) => {
		const result = await Api.getNode();

		if (result.status === "success") {
			this.setState({ activeTreeID: id, content: result.payload.content });
		} else {
			message.error(result.message);
			this.setState({ activeTreeID: id, content: "" });
		}
	};
	handleNewHash = () => {
		var location = window.location.hash.replace(/^#\/?|\/$/g, "").split("/"); //hash looks like #0002/Quicktext-more-whatever
		if (location.length > 0 && location[0].length > 0) {
			// if we pulled an ID
			//console.log("note: ",location);
			if (this.state.activeTabID !== location[0]) {
				this.setActiveTab(location[0]);
			}
			this.displayNodeHash(location[1]);
		}
	};

	//#######################################
	deleteNode = async (id) => {
		const result = await Api.deleteNode();

		if (result.status === "success") {
			/*const newTree = this.state.masterTree.filter((element, i) => {
				// for filter() if it doesn't match, it's true and is in the new array. if match, false so it gets filtered out
				return this.pruneTree(element, id);
			})*/

			// DONT DO THIS. should use filter() to cleanup state.masterTree instead of reassigning it from what the API returns
			this.setState({ masterTree: result.payload.tree, activeTreeID: null });

			result.payload.tree.forEach((node) => {
				if (node.id === this.state.activeTabID) {
					// default to the first node in tree
					if (node.children.length > 0) {
						this.displayNode(node.children[0].id);
					}
				}

				return null;
			});
		} else {
			message.error(result.message);
			this.setState({ activeTreeID: id, content: "" });
		}
	};

	saveNodeTitle = async (id, title) => {
		// find the matching node and edit the title
		const newTree = [...this.state.masterTree];

		newTree.map((node, key) => {
			let matched = this.searchTree(node, id);

			if (matched !== null) {
				matched.title = title;
				matched.editing = false;
			} else {
				matched = node;
			}

			return matched;
		});

		this.setState({ masterTree: newTree });

		const result = await Api.patchNode(id, title);

		if (result.status === "success") {
			message.success(result.message);
		} else {
			message.error(result.message);
		}
	};

	saveNodeExpand = async (id, expanded) => {
		// find the matching node and edit the title
		const newTree = [...this.state.masterTree];

		newTree.map((node, key) => {
			let matched = this.searchTree(node, id);

			if (matched !== null) {
				matched.expand = expanded;
			} else {
				matched = node;
			}

			return matched;
		});

		this.setState({ masterTree: newTree });

		const result = await Api.patchNode(id, "", expanded);

		if (result.status === "success") {
			message.success(result.message);
		} else {
			message.error(result.message);
		}
	};

	addChildNode = async (id) => {
		const result = await Api.insertTreeChild(id);

		if (result.status === "success") {
			// success
			const newNode = result.payload.node;
			newNode.editing = true;

			// find the matching node and add child
			const newTree = [...this.state.masterTree];

			newTree.map((node, key) => {
				let matched = this.searchTree(node, id);

				if (matched !== null) {
					matched.children = [...matched.children, newNode];
				} else {
					matched = node;
				}

				return matched;
			});
			//			console.log("newtree",  newTree.find(x => x.id===this.state.activeTabID).children);

			this.setState({ masterTree: newTree, activeTreeID: newNode.id, content: "" });
		} else {
			message.error(result.message);
		}
	};

	// display the tree for the clicked tab
	setActiveTab = (id) => {
		let node = this.state.masterTree.find((element) => {
			return element.id === id;
		});

		if (node) {
			this.setState({ activeTabID: id }, () => {
				// default to the first node in tab
				if (node.children.length > 0) {
					this.displayNode(node.children[0].id); // displayNode also sets state.activeTreeID
				}
			});
		}
	};

	addParentNode = async () => {
		const result = await Api.insertTreeParent();

		if (result.status === "success") {
			// success
			const newNode = result.payload.node;
			newNode.editing = true;
			this.setState({ tree: [...this.state.masterTree, newNode] });
		} else {
			message.error(result.message);
		}
	};

	// crawls the tree and gets an array of expanded keys
	expandedKeys = (tree) => {
		tree.map((node, key) => {
			if (node.expand && node.expand === true) {
				defaultExpandedKeys.push(node.id);
			}
			if (node.children != null) {
				this.expandedKeys(node.children);
			}

			return null;
		});
	};

	// searches tree and returns node with matching id
	searchTree = (element, id) => {
		if (element.id === id) {
			return element;
		} else if (element.children != null) {
			var i;
			var result = null;
			for (i = 0; result == null && i < element.children.length; i++) {
				result = this.searchTree(element.children[i], id);
			}
			return result;
		}
		return null;
	};

	activeNode = () => {
		if (!this.state.activeTreeID) {
			return null;
		}

		let out = null;

		this.state.masterTree.map((node, key) => {
			let matched = this.searchTree(node, this.state.activeTreeID);

			if (matched !== null) {
				out = matched;
			}

			return null;
		});

		return out;
	};

	render() {
		return (
			<div className="container">
				<Row>
					<Col>
						<Tabs
							activeTabID={this.state.activeTabID}
							setActiveTab={this.setActiveTab}
							tree={this.state.masterTree}
							deleteNode={this.deleteNode}
							saveNodeTitle={this.saveNodeTitle}
							addParentNode={this.addParentNode}
						/>
						<EditBar
							node={this.activeNode()}
							deleteNode={this.deleteNode}
							saveNodeTitle={this.saveNodeTitle}
							saveNodeExpand={this.saveNodeExpand}
							addChildNode={this.addChildNode}
						/>
					</Col>
				</Row>

				<Row gutter={16}>
					<Col xs={24} lg={6}>
						<aside className="tree">
							<TreeChildren
								tree={this.state.masterTree}
								activeTabID={this.state.activeTabID}
								activeTreeID={this.state.activeTreeID}
								expandedKeys={defaultExpandedKeys}
								displayNode={this.displayNode}
							/>
							<div className="treeAddBtn">
								<ButtonGroup size="small">
									<Button onClick={() => this.addChildNode(this.state.activeTabID)}>
										<Icon type="plus-circle" theme="twoTone" />
										Add
									</Button>
									<Button onClick={() => this.addChildNode(this.state.activeTreeID)}>
										<Icon type="plus-circle" />
										Add Child
									</Button>
								</ButtonGroup>
							</div>
						</aside>
					</Col>

					<Col xs={24} lg={18}>
						<Content id={this.state.activeTreeID} content={this.state.content} />
					</Col>
				</Row>
			</div>
		);
	}
}

export default App;
