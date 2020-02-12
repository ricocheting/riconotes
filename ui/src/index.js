import "antd/dist/antd.css";
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
// tablet ("chrome" 44) needs at least Array.map() and Object.assign() polyfill
import "core-js/stable";

ReactDOM.render(<App />, document.getElementById("root"));
