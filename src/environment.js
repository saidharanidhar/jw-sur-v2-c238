export const config = {
	host: "https://jw-test-sur-v1-c238.herokuapp.com", // Backend URL
	fileName: "JustWatchSurvey", // GoogleSheets FileName
	sheetID: "0", // Sheet Index
};

const env = {
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
				maxCategories: 20, // Max Categories to show
				showMaxPerCategory: 20, // Max Titles Per Category Max value - 20
				selectExact: 3, // Number of titles user should select.
			},
			{
				maxCategories: 40, // Max Categories to show
				showMaxPerCategory: 20, // Max Titles Per Category Max value - 20
				selectExact: 5, // Number of titles user should select.
			},
		],
	},
};

export default env;
