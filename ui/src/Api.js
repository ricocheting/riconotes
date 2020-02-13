export const Setting = {
	API_ENDPOINT: "/api/v1/riconotes", // do NOT include trailing slash. can be full http path if needed
};

// NOTE: anything run through here assumes you already error checked it
class Api {
	async myFetch(url, method = "GET", body = null, extraParam = null) {
		const init = {
			method: method,
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
			},
			body: body != null ? JSON.stringify(body) : undefined,
			...extraParam,
		};

		try {
			// uncomment the following line to debug instead of API submission
			//console.log("myFetch() "+method+" "+url+"\n",init);

			const data = await (await fetch(url, init)).json();
			//console.log("myFetch() response", data);

			return data;
		} catch (error) {
			//console.log("ERROR: myFetch() "+method+" "+url+"\n", error.message);
			return {
				code: 0,
				status: "error",
				message: "ERROR: " + method + " " + url + "",
				description: error.message,
				payload: {},
			};
		}
	}

	getTree(id = "") {
		console.log(id, id.length);
		const url = Setting.API_ENDPOINT + "/" + (id.length > 0 ? "?id=" + id : "");
		return this.myFetch(url, "GET");
	}

	getNode(id) {
		const url = Setting.API_ENDPOINT + "/" + id;
		return this.myFetch(url, "GET");
	}

	deleteNode(id) {
		const url = Setting.API_ENDPOINT + "/" + id;
		return this.myFetch(url, "DELETE");
	}

	putNode(id, content) {
		const url = Setting.API_ENDPOINT + "/" + id;

		const body = {
			content: content,
		};
		console.log("PUT", url, body);

		return this.myFetch(url, "PUT", body);
	}

	patchNode(id, title = "", expand = false) {
		const url = Setting.API_ENDPOINT + "/" + id;

		const body = {
			title: title,
			expand: expand,
		};

		return this.myFetch(url, "PATCH", body);
	}

	insertTreeParent() {
		const url = Setting.API_ENDPOINT + "/";
		return this.myFetch(url, "POST");
	}
	insertTreeChild(id) {
		const url = Setting.API_ENDPOINT + "/" + id + "/child";
		return this.myFetch(url, "POST");
	}

	/*	putPaths(paths: PathProps[]) {
		const url = Setting.API_ENDPOINT + "/paths";

		const body = {
			paths: paths,
		};

		return this.myFetch(url, "PUT", body);
	}*/
}

export default new Api();
