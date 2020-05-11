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
			contentEdit: this.props.content ? this.props.content : "",
			contentCachePre: "", // "cache" are values that is written back into "content" (for "Cancel" or unedited portions of markdown)
			contentCacheSection: "",
			contentCachePost: "",

			modalEditVisible: false,
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
							const [pre, section, post] = this.FindSection(props["data-sourcepos"]);
							this.setState({
								modalEditVisible: true,
								contentCachePre: pre,
								contentCacheSection: section,
								contentCachePost: post,
								contentEdit: section,
							});
						}}
					/>
				</>
			);
		},
	};

	// FindSection looks through the content and tries to split it into sections
	FindSection = (sourcepos) => {
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

		// get where the section ends (where a similar or lower level Hx starts. or end)
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
			section = lines.slice(lineNo, lineEnd).join("\n"),
			post = lines.slice(lineEnd).join("\n");

		return [pre, section, post];
	};

	// takes the three sections split by FindSection() and put them back together
	concantContent(pre, section, post) {
		if (pre.length > 0) {
			pre = pre + divider;
		}
		if (post.length > 0) {
			section = section + divider;
		}

		return pre + section + post;
	}

	editorShow = () => {
		this.setState({
			modalEditVisible: true,
			contentEdit: this.state.content,
			contentCachePre: "",
			contentCacheSection: this.state.content,
			contentCachePost: "",
		});
	};

	editorCancel = () => {
		const content = this.concantContent(this.state.contentCachePre, this.state.contentCacheSection, this.state.contentCachePost);

		this.setState({
			modalEditVisible: false,
			content: content,
			contentEdit: content, // if you do not update contentEdit, you can see the modal content revert back to original opening value before it closes
		});
	};

	saveContent = async (section) => {
		let { contentCachePre, contentCachePost } = this.state;

		const content = this.concantContent(contentCachePre, section, contentCachePost);
		const result = await Api.putNode(this.state.id, content);

		if (result.status === "success") {
			message.success(result.message);

			// close the modal and update the content
			this.setState({
				modalEditVisible: false,
				contentEdit: content, // if you do not update contentEdit, you can see the modal content revert back to original opening value before it closes
				content: content,
			});
		} else {
			message.error(result.message);
		}
	};

	render() {
		if (!this.props.id) {
			return "";
		}

		return (
			<div>
				<div style={{ margin: "10px 0" }}>
					<Button onClick={this.editorShow} type="primary" icon="edit">
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
					onCancel={this.editorCancel}
					content={this.state.contentEdit}
				/>
			</div>
		);
	}
}

export default Content;
