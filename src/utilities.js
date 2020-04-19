import env, { config } from "./environment";

import axios from "axios";

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const charactersLength = characters.length;

export function generateSession() {
	var result = "";
	for (var i = 0; i < 22; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export function sendRequest(method, url, data, onSuccess, onFailure) {
	const encodedUrl = encodeURIComponent(url);
	const proxyURL = env.proxy(encodedUrl);
	axios({ method, url: proxyURL, data }).then(onSuccess).catch(onFailure);
}

export function storeData(data) {
	data.iteration += 1;
	return axios({
		method: "post",
		url: env.saveData,
		data: { data, file_name: config.fileName, sheet_id: config.sheetID },
	});
}
