let api_endpoint = "/api/v1/riconotes/"; // include trailing slash

if (window.location.host === "localhost:3000" || window.location.host === "192.168.1.25:3000") {
	api_endpoint = "http://dashboard" + api_endpoint; // need an API endpoint domain if I'm running localhost npm dev
}

export const settings = {
	API_ENDPOINT: api_endpoint,
};
