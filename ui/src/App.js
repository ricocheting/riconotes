import React, { Component } from "react";
import Content from "./Content";
import Api from "./Api";

import Tabs from "./Tabs";
import TreeChildren from "./Tree";
import EditBar from "./EditBar";
import { Row, Col, Icon, Button, message } from "antd";
const ButtonGroup = Button.Group;

let defaultExpandedKeys = [];

class App extends Component {
	state = {
		masterTree: [], //{id: "1", title: "Title One", children: [{tree},{tree}]}
		activeTabID: null,
		activeTreeID: null,
		content: "",
	};

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
				callback = this.displayNode(location[1]); // display the content for this activeTreeID
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
	setNode = (id) => {
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
	displayNode = async (id) => {
		const result = await Api.getNode(id);

		if (result.status === "success") {
			const content = result.payload.content ? result.payload.content : "";
			this.setState({ activeTreeID: id, content: content });
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
				this.displayTab(location[0]);
			}
			this.displayNode(location[1]);
		}
	};

	//#######################################
	deleteNode = async (id) => {
		const result = await Api.deleteNode(id);

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
						this.setNode(node.children[0].id);
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

	addNodeChild = async (id) => {
		const result = await Api.insertTreeChild(id);

		if (result.status === "success") {
			// success
			let newNode = result.payload.node;
			newNode.editing = true;

			// find the matching node and add child
			const newTree = [...this.state.masterTree];

			newTree.map((node, key) => {
				let matched = this.searchTree(node, id);
				if (matched !== null) {
					matched.expand = true;
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
	displayTab = (id) => {
		let node = this.state.masterTree.find((element) => {
			return element.id === id;
		});

		if (node) {
			const activeTreeID = node.children.length > 0 ? node.children[0].id : null;

			this.setState({ activeTabID: id, activeTreeID: activeTreeID }, () => {
				this.setNode(activeTreeID); // displayNode also sets state.activeTreeID
			});
		}
	};

	addNodeParent = async () => {
		const result = await Api.insertTreeParent();

		if (result.status === "success") {
			// success
			let newNode = result.payload.node;
			newNode.editing = true;
			this.setState({ masterTree: [...this.state.masterTree, newNode] });
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

	// returns node that is active
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
							setActiveTab={this.displayTab}
							tree={this.state.masterTree}
							deleteNode={this.deleteNode}
							saveNodeTitle={this.saveNodeTitle}
							addParentNode={this.addNodeParent}
						/>
						<EditBar
							node={this.activeNode()}
							deleteNode={this.deleteNode}
							saveNodeTitle={this.saveNodeTitle}
							saveNodeExpand={this.saveNodeExpand}
							addChildNode={this.addNodeChild}
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
								displayNode={this.setNode}
							/>
							<div className="treeAddBtn">
								<ButtonGroup size="small">
									<Button onClick={() => this.addNodeChild(this.state.activeTabID)}>
										<Icon type="plus-circle" theme="twoTone" />
										Add
									</Button>
									<Button onClick={() => this.addNodeChild(this.state.activeTreeID)}>
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
