export const config = {
	host: "https://jw-test-sur-v1-c238.herokuapp.com", // Backend URL
	// host: "http://localhost:5000", // Backend URL
	fileName: "JustWatchSurvey", // GoogleSheets FileName
	sheetID: "0", // Sheet Index
};

const env = {
	fetchTitlesURL: `${config.host}/fetch/`,
	recommendationURL: `${config.host}/recommendations/`,
	saveData: `${config.host}/submit/`,
	proxy: (encodedUrl) => {
		return `${config.host}/${encodedUrl}/end/`;
	},
	settings: {
		identifier: "survey-identifier",
		topOnRegion: ["en_US", "en_CA"],
		maxIterations: 2, // Number of iterations the survey should run
		survey: [
			{
				showMax: 100, // Max Titles a User should see.
				pageSize: 10, // Number of titles to pull at a time.
				selectExact: 3, // Number of titles user should select.
			},
			{
				showMax: 200, // Max Titles a User should see.
				pageSize: 10, // Number of titles to pull at a time.
				selectExact: 5, // Number of titles user should select.
			},
		],
		choose: [
			{
				showExact: 20, // Number of Recommendations to show
				selectExact: 3, // Number of titles user should select.
			},
			{
				showExact: 20, // Number of Recommendations to show
				selectExact: 5, // Number of titles user should select.
			},
		],
	},
};

export default env;
