import "./global.css";

import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";

import React from "react";
import env from "./environment";
import { sendRequest } from "./utilities";

const surveySettings = env.settings.survey;
const maxIterations = env.settings.maxIterations;

class Survey extends React.Component {
	state = {
		titles: [],
		selected: new Set(),
		requestInProgress: false,
		eventlogs: [],
		settings:
			surveySettings[this.props.location.state.iteration] || surveySettings[0],
		trackTime: null,
		page: -1,
		...this.props.location.state,
	};
	scrollRef = React.createRef();

	createEventLog = (log, initialize, callback = () => {}) => {
		const { eventlogs, trackTime } = this.state;
		if (!trackTime) {
			if (initialize) this.setState({ trackTime: new Date() }, callback);
			return;
		}
		this.setState(
			{ eventlogs: [...eventlogs, `${log} ${new Date() - trackTime}`] },
			callback
		);
	};

	getRegisterUserAPIConfig = () => {
		const { region, sessionID } = this.state;
		const url = `https://apis.justwatch.com/personalization/settings/${region}/mutate?justwatch_id=${sessionID}`;
		const data = {
			mutations: [
				{
					field: "taste_survey_type",
					unset: "",
					set: "AUTO_DIGGER",
				},
				{
					field: "providers",
					unset: [],
					set: ["nfx", "prv"],
				},
				{
					field: "taste_survey_model_version",
					unset: "",
					set: "2020-01-08_14-49-42-ab_high_perc",
				},
			],
		};
		return { url, data, method: "post" };
	};

	getTitlesAPIConfig = () => {
		const { region, sessionID, settings } = this.state;
		const url = `https://apis.justwatch.com/discovery/taste_survey/${region}/next_titles?justwatch_id=${sessionID}`;
		const data = {
			count: settings.pageSize,
			fields: ["poster", "id", "object_type", "title"],
			new_liked_jw_entity_ids: [],
		};
		return { url, data, method: "post" };
	};

	componentDidMount() {
		const { key, iteration, settings } = this.state;
		if (key !== "SecretKey" || !settings) {
			this.onRequestFail();
			return;
		}

		if (iteration >= maxIterations) {
			this.endSurvey();
			return;
		}

		const { url, data, method } = this.getRegisterUserAPIConfig();
		sendRequest(
			method,
			url,
			data,
			this.registerInfiniteLoader,
			this.onRequestFail
		);
	}

	registerInfiniteLoader = () => {
		const config = {
			rootMargin: "50px 20px 75px 30px",
			threshold: [0.25, 0.75, 1],
		};
		const observer = new IntersectionObserver(this.getTitles, config);
		observer.observe(this.scrollRef.current);
	};

	onRequestFail = (err) => {
		console.log("Error Encountered", err);
		this.props.history.push("/");
	};

	endSurvey = () => {
		this.props.history.push("/end");
	};

	getTitles = (entries) => {
		entries.forEach((entry) => {
			if (
				this.state.requestInProgress ||
				entry.intersectionRatio === 0 ||
				this.state.titles.length >= this.state.settings.showMax
			)
				return;
			this.LoadTitles();
		});
	};

	LoadTitles = () => {
		this.setState({ requestInProgress: true }, () =>
			this.createEventLog("Loading Titles")
		);
		const { url, data, method } = this.getTitlesAPIConfig();
		sendRequest(method, url, data, this.setTitles, this.onRequestFail);
	};

	setTitles = (res) => {
		this.setState(
			{
				requestInProgress: false,
				page: this.state.page + 1,
				titles: [...this.state.titles, ...res.data.next_titles].slice(
					0,
					this.state.settings.showMax
				),
			},
			() => {
				if (
					document.documentElement.scrollHeight - window.innerHeight < 500 &&
					this.state.titles.length < this.state.settings.showMax
				) {
					this.createEventLog(
						"Titles Loaded are less, auto triggering again",
						true,
						this.LoadTitles
					);

					return;
				}
				this.createEventLog("Titles Loaded", true);
			}
		);
	};

	toggleCard = (item) => {
		const { selected, settings } = this.state;
		const itemLog = JSON.stringify(item);
		if (!selected.has(item)) {
			if (selected.size === settings.selectExact) {
				this.createEventLog(`Tried Selecting ${itemLog}`);
				return;
			}
			this.createEventLog(`Selected ${itemLog}`);
			selected.add(item);
		} else {
			this.createEventLog(`Removed ${itemLog}`);
			selected.delete(item);
		}
		this.setState({ selected });
	};

	nextPage = (data) => {
		const { region, iteration } = this.state;
		this.props.history.push({
			pathname: `/${region}/${iteration}/choose`,
			state: {
				...this.props.location.state,
				surveyData: data,
			},
		});
	};

	proceed = (event) => {
		this.createEventLog("Clicked on Proceed", true, () => {
			const {
				selected,
				eventlogs,
				settings,
				trackTime,
				page,
				titles,
			} = this.state;
			if (selected.size === settings.selectExact) {
				const titlesCompressed = [
					["jw_entity_id", "title", "poster", "object_type"],
					...titles.map((item) => {
						return [
							item.jw_entity_id,
							item.title,
							item.poster,
							item.object_type,
						];
					}),
				];
				const data = {
					page,
					settings,
					eventlogs,
					selected: [...selected],
					titles: titlesCompressed,
					duration: new Date() - trackTime,
				};
				this.nextPage(data);
			}
		});
	};

	render() {
		const { selected, titles, settings, iteration, maxIterations } = this.state;
		return (
			<Container fluid>
				<Row className="justify-content-md-center page-title-row">
					<Col md={"auto"}>
						<h4 className="page-title-h4">
							Step {iteration * 3 + 1}/{maxIterations * 3}: Select{" "}
							{settings.selectExact} titles
						</h4>
					</Col>
				</Row>
				<Row className="survey-cards-row">
					{titles.map((item, index) => {
						item["index"] = index;
						return (
							<Card
								className="survey-image-cards"
								onClick={() => this.toggleCard(item)}
								key={item.jw_entity_id}
							>
								<Card.Body>
									<Card.Img
										className={
											selected.has(item)
												? "survey-image-selected"
												: "survey-image-not-selected"
										}
										variant="top"
										src={`https://images.justwatch.com${item.poster.replace(
											"{profile}",
											"s166"
										)}`}
									/>
								</Card.Body>
							</Card>
						);
					})}
				</Row>
				<div className="survey-infinite-scroll-div" ref={this.scrollRef}>
					{titles.length >= settings.showMax ? (
						<div>
							<h5>No more titles to present</h5>
						</div>
					) : (
						<Spinner animation="border" variant="warning" />
					)}
				</div>
				{selected.size === settings.selectExact && (
					<Row className="survey-proceed-row">
						<Col xs={12} className="survey-proceed-col-items-center">
							<Button variant="success" size="lg" onClick={this.proceed}>
								Proceed
							</Button>
						</Col>
					</Row>
				)}
			</Container>
		);
	}
}

export default Survey;
