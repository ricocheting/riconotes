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
		window.addEventListener("hashchange", this.getHash, false);

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

				// if we pulled a nodeID
				if (location.length > 1 && location[1].length > 0) {
					callback = this.displayNode(location[1]); // display the content for this activeTreeID
				}
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
	setNode = (id) => {
		if (Array.isArray(id)) {
			// the Tree.onSelect() can return multiple ids so it gives back an array. we only care about the first
			id = id[0];
		}

		this.setHash(this.state.activeTabID, id);
	};
	setTab = (id) => {
		this.setHash(id);
	};

	// update the window.location.href hash
	setHash = (tabID = null, nodeID = null) => {
		let newHash = "#";

		// contains at least one id
		if (tabID !== null || nodeID !== null) {
			let title = "";

			if (nodeID !== null) {
				this.state.masterTree.map((node, key) => {
					let matched = this.searchTree(node, nodeID);

					if (matched !== null) {
						title = matched.title
							.replace(/[^a-z0-9]/gi, "-")
							.replace(/-+/gi, "-")
							.replace(/^-|-$/gi, "");

						if (tabID === null) {
							tabID = node.ID;
						}
					}

					return null;
				});
			}

			newHash += tabID;

			if (title.length > 0) {
				newHash += "/" + nodeID + "/" + title;
			}
		}

		// change the location. which triggers the handleNewHash() listener assigned in componentDidMount() which triggers displayNodeHash()
		window.location.href = window.location.href.replace(/#(.*)$/, "") + newHash;
	};

	getHash = () => {
		var location = window.location.hash.replace(/^#\/?|\/$/g, "").split("/"); //hash looks like #0002/0263/Quicktext-more-whatever where #tabID/nodeID/Title
		if (location.length > 0 && location[0].length > 0) {
			console.log("getHash activeTabID:", this.state.activeTabID, "location:", location);
			// tab changed
			if (this.state.activeTabID !== location[0]) {
				this.displayTab(location[0], location[1]);
			} else if (location.length > 1 && location[1].length > 0) {
				this.displayNode(location[1]);
			}
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
			this.setState({ masterTree: result.payload.tree, activeTreeID: null }, () => {
				this.setHash(this.state.activeTabID);
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
	displayTab = (tabID, nodeID = null) => {
		const node = this.state.masterTree.find((element) => {
			return element.id === tabID;
		});

		console.log("displayTab", tabID, nodeID, node);

		if (node) {
			if (nodeID === null) {
				nodeID = node.children.length > 0 ? node.children[0].id : null;
			}

			this.setState({ activeTabID: tabID }, () => {
				this.displayNode(nodeID);
			});
		}
	};
	// query the API to pull the content for this ID
	displayNode = async (nodeID) => {
		if (nodeID === null) {
			this.setState({ activeTreeID: nodeID, content: "" });
			return;
		}

		const result = await Api.getNode(nodeID);

		console.log("displayNode", nodeID, result.payload.content);

		if (result.status === "success") {
			const content = result.payload.content ? result.payload.content : "";
			this.setState({ activeTreeID: nodeID, content: content });
		} else {
			message.error(result.message);
			this.setState({ activeTreeID: nodeID, content: "" });
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
							setActiveTab={this.setHash}
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
