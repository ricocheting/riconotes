import React, { Component } from "react";
import Api from "./Api";
import { Modal, Button, Empty, message } from "antd";
import ReactMarkdown from "react-markdown";

const xtend = require("xtend");

const ButtonGroup = Button.Group;

const renderers = {
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
		// example taken from https://github.com/rexxars/react-markdown/blob/master/src/renderers.js#L66 and xtend() from #L58
		return React.createElement(
			`h${props.level}`,
			xtend(
				{
					onClick: () => {
						console.log(props.level, props["data-sourcepos"]);
					},
				},
				props
			),
			props.children
		);
	},
};

const FindBlock = (markdown, lineStart) => {
	// get level of lineStart
	let pre,
		block,
		post = "";

	return Array(pre, block, post);
};

class Content extends Component {
	constructor(props) {
		super(props);

		this.editRef = React.createRef();

		this.state = {
			id: this.props.id,
			contentCache: "", // value that is written back into "content" when Cancel is pushed
			content: this.props.content ? this.props.content : "",
			spellCheck: false,
			activeKey: "code", // default active tab
			modalPasteVisible: false,
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

	onTabChange = (activeKey) => {
		this.setState({ activeKey });
	};

	// update the state of TreeNode.title every time title is changed
	changeContent = (e) => {
		const { value } = e.target;

		this.setState({
			content: value,
		});
	};

	pasteModalShow = () => {
		this.setState({
			modalPasteVisible: true,
			pasteText: "",
		});
	};
	pasteModalCancel = (e) => {
		this.setState({
			modalPasteVisible: false,
			pasteText: "",
		});
	};
	pasteModalOk = (e) => {
		this.setState({
			modalPasteVisible: false,
		});

		// turn HTML into markdown
		const result = this.state.pasteText.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, "[$2]($1)");

		this.editInsert(result, "");
	};
	pasteModalChangeContent = (e) => {
		const { value } = e.target;

		this.setState({
			pasteText: value,
		});
	};

	contentManipulate = (opening, prefix, postfix, closing) => {
		const val = this.state.content,
			start = this.editRef.current.selectionStart,
			end = this.editRef.current.selectionEnd;

		if (start === end) {
			// single line/static cursor. ignore
			//return false;
		}

		let preSelect = val.substring(0, start),
			blocks = val.substring(start, end).split(/\r?\n/),
			postSelect = val.substring(end),
			firstSelectedLine = preSelect.lastIndexOf("\n"),
			lastSelectedLine = postSelect.indexOf("\n");

		if (firstSelectedLine === -1) {
			// the first line is selected. push any so first line into blocks[]. preSelect is empty
			blocks[0] = preSelect + (blocks[0] || "");
			preSelect = "";
		} else {
			// last \n and onward goes into blocks.
			firstSelectedLine += 1; //add one char so we start AFTER \n
			blocks[0] = preSelect.substring(firstSelectedLine) + (blocks[0] || "");
			preSelect = preSelect.substring(0, firstSelectedLine);
		}

		if (lastSelectedLine === -1) {
			// the last line is selected. push any post into blocks[]. postSelect is empty
			blocks[blocks.length - 1] = (blocks[blocks.length - 1] || "") + postSelect;
			postSelect = "";
		} else {
			// add \t after \n
			// \n is on the postSelect
			blocks[blocks.length - 1] = (blocks[blocks.length - 1] || "") + postSelect.substring(0, lastSelectedLine);
			postSelect = postSelect.substring(lastSelectedLine);
		}

		// turn selected rows into "<li>"+row+"</li>"
		const rows = blocks.map((row, index) => {
			return prefix + row + postfix;
		});

		const newContent =
			preSelect +
			opening +
			(opening.length > 0 ? "\n" : "") +
			rows.join("\n") +
			(closing.length > 0 ? "\n" : "") +
			closing +
			postSelect;

		//console.log(newContent);

		this.setState({ content: newContent }, () => {
			if (opening.length < 1 && prefix.length > 0 && postfix.length < 1 && closing.length < 1 && prefix !== "\t") {
				// inserting chars only at the begining of lines (and not inserting tab)
				this.editRef.current.selectionStart = this.editRef.current.selectionEnd = preSelect.length; // put cursor at start of first edited line
			} else if (opening.length < 1 && closing.length > 0) {
				// no opening. put cursor
				this.editRef.current.selectionStart = this.editRef.current.selectionEnd =
					preSelect.length + opening.length + 0 + rows.join("\n").length + 1 + closing.length; //tab inserted in pre + number inserted in selected
			} else {
				// select all
				this.editRef.current.selectionStart = preSelect.length; //start of new content
				this.editRef.current.selectionEnd =
					preSelect.length +
					opening.length +
					(opening.length > 0 ? 1 : 0) +
					rows.join("\n").length +
					(closing.length > 0 ? 1 : 0) +
					closing.length; //tab inserted in pre + number inserted in selected
			}
			this.editRef.current.focus();
		});
	};

	editKeyDown = (event) => {
		if (event.keyCode === 9) {
			// tab was pressed
			event.preventDefault();

			const val = this.state.content,
				start = this.editRef.current.selectionStart,
				end = this.editRef.current.selectionEnd;

			// if multiple lines are selected
			if ((val.substring(start, end).match(/\n/g) || []).length > 0) {
				// indent all
				if (!event.shiftKey) {
					this.contentManipulate("", "\t", "", "");
					return;
				}

				// collapse all
				let preSelect = val.substring(0, start),
					newSelect = val
						.substring(start, end)
						.replace(/\n\t/g, "\n")
						.replace(/^\t/g, ""),
					postSelect = val.substring(end);

				// find the "last" \n char of the first selected line (will be before the selected part) and see if it needs \t after it removed
				let firstSelectedLine = preSelect.lastIndexOf("\n");

				if (
					firstSelectedLine !== -1 &&
					preSelect.length > firstSelectedLine + 1 &&
					preSelect.substring(firstSelectedLine + 1, firstSelectedLine + 2) === "\t"
				) {
					// test if the char following the last \n is \t. if so, remove
					preSelect = preSelect.substring(0, firstSelectedLine + 1) + preSelect.substring(firstSelectedLine + 2);
				}

				this.setState({ content: preSelect + newSelect + postSelect }, () => {
					//callback
					this.editRef.current.selectionStart = start; //inserted tab in the pre
					this.editRef.current.selectionEnd = end + (newSelect.length - val.substring(start, end).length); //tab inserted in pre + number inserted in selected
				});
			} else {
				// single line/static cursor. insert tab at the cursor location
				this.editInsert("\t", "");
			}
		}
		// hijack page up/down because it freakin scrolls the .ant-tabs-content up into the .ant-tabs - this is a bug in chromium. see https://bugs.chromium.org/p/chromium/issues/detail?id=890248
		else if (event.keyCode === 33) {
			// page up is pressed
			event.preventDefault();
			this.editRef.current.scrollTop = 0;

			// put the cursor at the begining
			this.editRef.current.selectionStart = this.editRef.current.selectionEnd = 0;
		} else if (event.keyCode === 34) {
			// page down is pressed
			event.preventDefault();
			this.editRef.current.scrollTop = this.editRef.current.scrollHeight;

			// put the cursor at the very end of document
			this.editRef.current.selectionStart = this.editRef.current.selectionEnd = this.state.content.length;
		}
	};
	editInsert = (prefix, postfix) => {
		const val = this.state.content,
			start = this.editRef.current.selectionStart,
			end = this.editRef.current.selectionEnd;

		this.setState({ content: val.substring(0, start) + prefix + val.substring(start, end) + postfix + val.substring(end) }, () => {
			//callback
			if (start === end) {
				// if cursor, keep in place
				this.editRef.current.selectionStart = start + prefix.length;
				this.editRef.current.selectionEnd = start + prefix.length;
			} else {
				// if there was a selection, select insert + original selection
				this.editRef.current.selectionStart = start;
				this.editRef.current.selectionEnd = end + prefix.length + postfix.length;
			}
			this.editRef.current.focus();
		});
	};

	editShow = () => {
		this.setState({
			modalEditVisible: true,
			contentCache: this.state.content,
		});
	};

	editCancel = () => {
		this.setState({
			modalEditVisible: false,
			content: this.state.contentCache,
		});
	};

	saveContent = async () => {
		const result = await Api.putNode(this.state.id, this.state.content);

		if (result.status === "success") {
			message.success(result.message);

			// change it to the tab they passed in as the key parameter
			this.setState({
				modalEditVisible: false,
			});
		} else {
			message.error(result.message);
		}
	};

	// controls display for "Code"
	editFormatContentCode = (content) => {
		content = content.replace(/(^|\n)### ([^\n]+)\n/g, "$1<h3>$2</h3>"); // header tags. run before <hr> or <ul> strips out \n
		content = content.replace(/(^|\n)## ([^\n]+)\n/g, "$1<h2>$2</h2>");
		content = content.replace(/(^|\n)# ([^\n]+)\n/g, "$1<h1>$2</h1>");

		content = content.replace(/\n-{3,}(\n|$)/g, "<hr />"); // replace --- (or more) with <hr>
		content = content.replace(/\n*<hr ?\/?>\n*/gi, "<hr />"); // remove newline spacing before/after <hr>

		content = content.replace(/\n*(<\/?[uo]l>)\n*/gi, "$1"); // remove newline spacing before/after <ul><ol></ul></ol>
		content = content.replace(/\n*(<\/?li>)\n*/gi, "$1"); // <li></li>

		content = content.replace(/```(?:[a-z]*)\n([^`]+)\n```(?:\n|$)/g, "<code>$1</code>\n"); // block <code></code>
		content = content.replace(/`([^`]+)`/g, '<code class="inline">$1</code>'); // inline <code></code>

		content = content.replace(/(?:(\n|[^:]))(\/\/[^\n]+)/g, '$1<span class="comment">$2</span>'); // comment but not :// in links

		content = content.replace(/([^"#])(https?:\/\/[^\n [(<]+)/g, '$1<a href="$2">$2</a>'); // convert http:// to links but watch href="http:// and http://link/#http://site/

		return content;
	};

	displayModal = () => {
		this.setState({
			content: this.props.content ? this.props.content : "",
		});
	};

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
					<ReactMarkdown className="markdown-body" source={this.state.content} renderers={renderers} sourcePos={true} />
				) : (
					<Empty description={<span>No text entered</span>} />
				)}

				<Modal
					className="contentPasteModal"
					title="Insert HTML"
					visible={this.state.modalPasteVisible}
					onOk={this.pasteModalOk}
					onCancel={this.pasteModalCancel}>
					<textarea
						placeholder="Paste code here..."
						rows={10}
						onChange={this.pasteModalChangeContent}
						value={this.state.pasteText}
					/>
				</Modal>

				<Modal
					className="modal-edit"
					width="auto"
					visible={this.state.modalEditVisible}
					onOk={this.saveContent}
					okText="Save"
					onCancel={this.editCancel}>
					<div className="modal-edit-buttons">
						<ButtonGroup>
							<Button onClick={() => this.editInsert("**", "**")} icon="bold" title="Bold"></Button>
							<Button onClick={() => this.editInsert("*", "*")} icon="italic" title="Italic"></Button>
							<Button onClick={() => this.editInsert("~~", "~~")} icon="strikethrough" title="Strikethrough"></Button>
						</ButtonGroup>
						<ButtonGroup>
							<Button onClick={() => this.contentManipulate("", "# ", "", "")} title="Heading 1">
								H1
							</Button>
							<Button onClick={() => this.contentManipulate("", "## ", "", "")} title="Heading 2">
								H2
							</Button>
							<Button onClick={() => this.contentManipulate("", "### ", "", "")} title="Heading 3">
								H3
							</Button>
						</ButtonGroup>
						<ButtonGroup>
							<Button
								onClick={() => this.contentManipulate("", "* ", "", "")}
								icon="unordered-list"
								title="Unordered List"></Button>
							<Button
								onClick={() => this.contentManipulate("", "1. ", "", "")}
								icon="ordered-list"
								title="Ordered List"></Button>
						</ButtonGroup>
						<ButtonGroup>
							<Button
								onClick={() => this.contentManipulate("", "", "", "-------------------------\n")}
								icon="line"
								title="Horizontal Rule"></Button>
						</ButtonGroup>

						<ButtonGroup>
							<Button
								type={this.state.spellCheck ? "primary" : "default"}
								onClick={() => this.setState({ spellCheck: !this.state.spellCheck })}
								title="Toggle Spellcheck"
								icon="file-done"></Button>
						</ButtonGroup>

						<ButtonGroup>
							<Button
								onClick={this.pasteModalShow}
								title="Convert HTML Links to markdown"
								icon="snippets"
								style={{ borderColor: "black" }}></Button>
						</ButtonGroup>
					</div>

					<div className="contentBlock">
						<div className="contentEdit">
							<textarea
								className="ant-input"
								ref={this.editRef}
								placeholder="Enter new note ..."
								value={this.state.content}
								spellCheck={this.state.spellCheck}
								onChange={this.changeContent}
								onKeyDown={this.editKeyDown}
							/>
						</div>
						<ReactMarkdown className="markdown-body" source={this.state.content} renderers={renderers} sourcePos={true} />
					</div>
				</Modal>
			</div>
		);
	}
}

export default Content;
