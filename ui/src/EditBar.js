import React, { Component } from "react";
import { Popconfirm, Button, Input, Checkbox, Icon } from "antd";

const InputGroup = Input.Group;

const Expand = (props) => {
	if (props.node.children.length < 1) {
		return null;
	}

	return (
		<Checkbox onChange={props.onExpand} checked={props.expand}>
			Expanded
		</Checkbox>
	);
};
class EditBar extends Component {
	constructor(props) {
		super(props);
		this.lastInput = React.createRef(); // so know which element was last // https://reactjs.org/docs/refs-and-the-dom.html

		this.initialState = {
			title: "",
			editing: false,
			expand: false,
		};

		this.state = this.initialState;
	}

	componentDidUpdate(prevProps) {
		// if the ID updated, overwrite
		if (this.props.node && (!prevProps.node || prevProps.node.id !== this.props.node.id)) {
			this.setState(
				{
					title: this.props.node.title,
					editing: this.props.node.editing,
					expand: this.props.node.expand || false,
				},
				() => {
					if (this.props.node.editing) {
						// if we're editing a new node title, focus/select it
						this.lastInput.current.focus();
						this.lastInput.current.select();
					}
				}
			);
		}
	}

	// toggle edit title
	onEditing = () => {
		// if turning off edit and the title has changed, save it
		if (this.state.editing && this.state.title !== this.props.node.title) {
			this.props.saveNodeTitle(this.props.node.id, this.state.title);
		}

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

	onEditingCancel = (event) => {
		this.setState({ title: this.props.node.title, editing: false });
	};

	// update state.title every time title nput box is changed
	changeTitle = (event) => {
		const { value } = event.target;

		this.setState({
			title: value,
		});
	};

	onDelete = () => {
		this.props.deleteNode(this.props.node.id);
	};

	onSubmitTitle = (event) => {
		//if(event.charCode === 13 || event.keyCode === 13){// pressed enter
		this.props.saveNodeTitle(this.props.node.id, this.state.title);
		this.onEditing();
		//}
	};

	onExpand = (event) => {
		this.setState({
			expand: event.target.checked,
		});

		this.props.saveNodeExpand(this.props.node.id, event.target.checked);
	};

	render() {
		const node = this.props.node;

		// display nothing if no valid node
		if (node === null) {
			return <div className="header-bar"></div>;
		}

		return (
			<div className="header-bar">
				<div hidden={!this.state.editing}>
					<InputGroup compact size="default">
						<Popconfirm placement="bottomRight" title="Are you sure?" onConfirm={this.onDelete} okText="Yes" cancelText="No">
							<Button title={"Edit node #" + this.props.node.id} type="danger" icon="delete">
								Delete
							</Button>
						</Popconfirm>
						<Input
							value={this.state.title}
							onChange={this.changeTitle}
							onPressEnter={this.onSubmitTitle}
							ref={this.lastInput}
							style={{ width: 300 }}
						/>
						<Button onClick={this.onEditingCancel}>Cancel</Button>
						<Button onClick={this.onSubmitTitle} type="primary" icon="save">
							Save
						</Button>
					</InputGroup>
				</div>

				<div hidden={this.state.editing}>
					<h2>{this.state.title}</h2>

					<Icon type="edit" onClick={this.onEditing} title={"node #" + this.props.node.id} />

					<Expand node={this.props.node} onExpand={this.onExpand} expand={this.state.expand} />
				</div>
			</div>
		);
	}
}

export default EditBar;
