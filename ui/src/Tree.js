import React, { Component } from "react";
import { Tree, Empty, Tooltip } from "antd";
import { PlusCircleTwoTone } from "@ant-design/icons";

const { TreeNode } = Tree;


class TreeControls extends Component {
	render() {
		const { id } = this.props;

		return (<div className="controls">
			<Tooltip placement="left" title="Add Child">
				<span onClick={(e) => { this.props.addNodeChild(id); e.stopPropagation(); }}><PlusCircleTwoTone /></span>
			</Tooltip>
		</div >);
	}
}


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
							blockNode={true}
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
			const title = <>{item.title} <TreeControls id={item.id} addNodeChild={this.props.addNodeChild} /></>

			if (item.children && item.children.length > 0) {

				return (
					<TreeNode title={title} key={item.id}>
						{this.renderTreeNodes(item.children)}
					</TreeNode>
				);
			}
			return <TreeNode title={title} key={item.id} />;
		});

	onSelect = (selectedKey, info) => {
		if (selectedKey.length < 1) {
			// don't let it "unselect" the current/only node
			return false;
		}

		this.props.displayNode(selectedKey);
	};

	onExpand = (expandedKeys, e) => {
		const id = e.node.key;

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
			return <Empty description={<span>No tree entries</span>} />;
		}

		return this.renderTreeParentNodes(this.props.tree);
	}
}

export default TreeChildren;
