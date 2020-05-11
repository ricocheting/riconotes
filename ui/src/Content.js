import React, { Component } from "react";
import Api from "./Api";
import Editor from "./Editor";
import { Button, Empty, Icon, message } from "antd";
import ReactMarkdown from "react-markdown";

const divider = `\n`;

class Content extends Component {
	constructor(props) {
		super(props);

		this.editRef = React.createRef();

		this.state = {
			id: this.props.id,
			content: this.props.content ? this.props.content : "",
			contentCachePre: "", // value that is written back into "content" when Cancel is pushed
			contentCacheBlock: "",
			contentCachePost: "",
			contentEdit: this.props.content ? this.props.content : "",
			spellCheck: false,
			modalEditVisible: false,
			pasteText: "",
		};
	}

	componentDidUpdate(prevProps) {
		// if the ID updated, overwrite
		if (prevProps.id !== this.props.id) {
			this.setState({
				id: this.props.id,
				content: this.props.content,
			});
		}
	}

	markdownRenderers = {
		// fix for react-markdown tries to link anything in brackets
		// https://github.com/rexxars/react-markdown/issues/115
		// https://github.com/rexxars/react-markdown/issues/218
		// https://github.com/rexxars/react-markdown/issues/276
		linkReference: (reference) => {
			// linkReference: (reference: Object): Node => {
			if (!reference.href) {
				//return `[${reference.children[0].props.children}]`;
				return <>[{reference.children[0]}]</>;
			}

			return <a href={reference.$ref}>{reference.children}</a>;
		},

		heading: (props) => {
			if (!props) {
				props = { level: 1 };
			}
			const children = props.children[0] ? props.children[0].props.value : "";
			// example taken from https://github.com/rexxars/react-markdown/blob/master/src/renderers.js#L66
			return React.createElement(
				`h${props.level}`,
				props,
				<>
					{children}{" "}
					<Icon
						type="edit"
						onClick={() => {
							const [pre, block, post] = this.FindBlock(props["data-sourcepos"]);
							this.setState({
								modalEditVisible: true,
								contentCachePre: pre,
								contentCacheBlock: block,
								contentCachePost: post,
								contentEdit: block,
							});
						}}
					/>
				</>
			);
		},
	};

	FindBlock = (sourcepos) => {
		const { content } = this.state;
		const lines = content.split(/\r?\n/);

		// get the current line number
		const reSourcepos = /^(\d+):(\d+)-(\d+):(\d+)$/; //13:1-13:14
		const reHeading = /^(#{1,6}) /; //#, ##, ###
		const result = reSourcepos.exec(sourcepos);
		const lineNo = result.length > 1 ? parseInt(result[1]) - 1 : 0;

		// get the current line number's H1-H6 level
		let level = 0;
		if (lines[lineNo]) {
			const result = reHeading.exec(lines[lineNo]);
			if (result.length > 1) {
				level = result[1].length;
			}
		}

		// get where the block ends (where a similar or lower level Hx starts. or end)
		let lineEnd = lines.length;
		for (let i = lineNo + 1, n = lines.length; i <= n; i++) {
			const result = reHeading.exec(lines[i]);
			if (result && result.length > 1 && result[1].length <= level) {
				lineEnd = i;
				break;
			}
		}

		// get the contents of each section and rejoin them
		let pre = lines.slice(0, lineNo).join("\n"),
			block = lines.slice(lineNo, lineEnd).join("\n"),
			post = lines.slice(lineEnd).join("\n");

		console.log("pre", block);
		//console.log(lineEnd + " at " + lines[lineEnd]);

		return [pre, block, post];
	};

	// update the state of TreeNode.title every time title is changed
	changeContent = (e) => {
		const { value } = e.target;

		this.setState({
			contentEdit: value,
		});
	};

	editShow = () => {
		this.setState({
			modalEditVisible: true,
			contentEdit: this.state.content,
			contentCachePre: "",
			contentCacheBlock: this.state.content,
			contentCachePost: "",
		});
	};

	editCancel = () => {
		this.setState({
			modalEditVisible: false,
			content: this.concantContent(this.state.contentCachePre, this.state.contentCacheBlock, this.state.contentCachePost),
		});
	};

	saveContent = async (block) => {
		let { contentCachePre, contentCachePost } = this.state;

		const content = this.concantContent(contentCachePre, block, contentCachePost);
		const result = await Api.putNode(this.state.id, content);

		if (result.status === "success") {
			message.success(result.message);

			// change it to the tab they passed in as the key parameter
			this.setState({
				modalEditVisible: false,
				content: content,
			});
		} else {
			message.error(result.message);
		}
	};

	concantContent(pre, block, post) {
		if (pre.length > 0) {
			pre = pre + divider;
		}
		if (post.length > 0) {
			block = block + divider;
		}

		return pre + block + post;
	}

	render() {
		if (!this.props.id) {
			return "";
		}

		return (
			<div>
				<div style={{ margin: "10px 0" }}>
					<Button onClick={this.editShow} type="primary" icon="edit">
						Edit
					</Button>
				</div>

				{this.state.content.length > 0 ? (
					<ReactMarkdown
						className="markdown-body"
						source={this.state.content}
						renderers={this.markdownRenderers}
						sourcePos={true}
					/>
				) : (
					<Empty description={<span>No text entered</span>} />
				)}

				<Editor
					visible={this.state.modalEditVisible}
					onSave={this.saveContent}
					onCancel={this.editCancel}
					content={this.state.contentEdit}
				/>
			</div>
		);
	}
}

export default Content;
