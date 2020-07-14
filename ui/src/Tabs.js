import React, { Component } from "react";
import { PlusCircleOutlined, ReloadOutlined, LockOutlined, UnlockOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

class Tabs extends Component {
	constructor(props) {
		super(props);

		this.initialState = {
			locked: true,
			tree: [],
		};

		this.state = this.initialState;
	}

	toggleLock = () => {
		this.setState({
			locked: !this.state.locked,
		});
	};

	isActive = (id) => {
		return this.props.activeTabID === id;
	};

	render() {
		// pass the props through as a parameter, and map through the array to return a table row for each object in the array
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
		const tabs = this.props.tree.map((node, key) => {
			return (
				<TabChild
					activeTabID={this.props.activeTabID}
					isActive={this.isActive(node.id)}
					setActiveTab={this.props.setActiveTab}
					deleteNode={this.props.deleteNode}
					saveNodeTitle={this.props.saveNodeTitle}
					key={node.id}
					tree={node}
					locked={this.state.locked}
				/>
			);
		});

		return (
			<ul className="tab-bar">
				{tabs}
				<li className="tab add" hidden={this.state.locked} onClick={this.props.addParentNode}>
					<div className="title">
						<div>
							Add Tab <PlusCircleOutlined />
						</div>
					</div>
				</li>
				<li className="tab add" hidden={this.state.locked} onClick={this.props.reload}>
					<div className="title">
						<div>
							Reload <ReloadOutlined />
						</div>
					</div>
				</li>
				<li className="lock" onClick={this.toggleLock}>
					{this.state.locked ? <LockOutlined /> : <UnlockOutlined />}
				</li>
			</ul>
		);
	}
}

class TabChild extends Component {
	//We need the constructor() to use this.* and to receive the props of the parent.
	constructor(props) {
		super(props);
		this.lastInput = React.createRef(); // so know which element was last // https://reactjs.org/docs/refs-and-the-dom.html

		this.initialState = {
			title: this.props.tree.title,
			editing: this.props.tree.editing ? this.props.tree.editing : false,
			children: this.props.tree.children,
		};

		this.state = this.initialState;
	}

	// toggle edit title
	editableNode = () => {
		this.setState(
			{
				editing: !this.state.editing,
			},
			() => {
				this.lastInput.current.focus();
				this.lastInput.current.select();
			}
		);
	};

	// update the state of TreeNode.title every time title is changed
	changeTitle = (event) => {
		const { value } = event.target;

		this.setState({
			title: value,
		});
	};

	// if they pressed "enter" in the title field
	submitTitle = (event) => {
		if (event.charCode === 13 || event.keyCode === 13) {
			this.props.saveNodeTitle(this.props.tree.id, this.state.title);
			this.editableNode();
		}
	};

	render() {
		//const node = this.props.tree;
		const cn = "tab" + (this.props.isActive ? " active" : "");

		return (
			<li className={cn}>
				<div className="title">
					<div hidden={!this.state.editing}>
						<input
							type="text"
							name="title"
							value={this.state.title}
							onChange={this.changeTitle}
							onKeyPress={this.submitTitle}
							ref={this.lastInput}
						/>
					</div>
					<div hidden={this.state.editing} onClick={() => this.props.setActiveTab(this.props.tree.id)}>
						{this.state.title}
					</div>
				</div>
				<div className="icons-list" hidden={this.props.locked}>
					<EditOutlined onClick={this.editableNode} />
					<DeleteOutlined onClick={() => this.props.deleteNode(this.props.tree.id)} />
				</div>
			</li>
		);
	}
}

export default Tabs;
