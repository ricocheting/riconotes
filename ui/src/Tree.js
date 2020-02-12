import React, { Component } from "react";
import { Tree } from "antd";

const { TreeNode } = Tree;

class TreeChildren extends Component {
	constructor(props) {
		super(props);

		this.state = {
			expandedKeys: [],
		};
	}

	componentDidMount() {
		this.setState({ expandedKeys: this.props.expandedKeys });
	}

	renderTreeParentNodes = (data) =>
		data.map((item) => {
			if (item.children && item.children.length > 0) {
				let disp = { display: "none" };
				if (this.props.activeTabID === item.id) {
					disp = { display: "block" };
				}

				//NOTE: <Tree/> property "selectedKeys" is array. "activeTreeID" is string and we only have one
				return (
					<div style={disp} key={item.id}>
						<Tree
							onExpand={this.onExpand}
							onSelect={this.onSelect}
							selectedKeys={[this.props.activeTreeID]}
							expandedKeys={this.state.expandedKeys}>
							{this.renderTreeNodes(item.children)}
						</Tree>
					</div>
				);
			}
			return null;
		});

	renderTreeNodes = (data) =>
		data.map((item) => {
			if (item.children && item.children.length > 0) {
				return (
					<TreeNode title={item.title} key={item.id} dataRef={item}>
						{this.renderTreeNodes(item.children)}
					</TreeNode>
				);
			}
			return <TreeNode title={item.title} key={item.id} dataRef={item} />;
		});

	onSelect = (selectedKey, info) => {
		if (selectedKey.length < 1) {
			// don't let it "unselect" the current/only node
			return false;
		}

		this.props.displayNode(selectedKey);
	};

	onExpand = (expandedKeys, e) => {
		const id = e.node.props.eventKey;

		if (e.expanded) {
			this.setState({ expandedKeys: [...this.state.expandedKeys, id] });
		} else {
			// remove the matched id
			const nExp = this.state.expandedKeys.filter(function(item) {
				return item !== id;
			});
			this.setState({ expandedKeys: nExp });
		}
	};

	render() {
		// because first run tree is empty
		if (this.props.tree.length < 1 || !this.props.activeTreeID) {
			return null;
		}

		return this.renderTreeParentNodes(this.props.tree);
	}
}

export default TreeChildren;
