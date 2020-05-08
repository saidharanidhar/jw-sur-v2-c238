import "./global.css";

import {
	Button,
	Card,
	Col,
	Container,
	OverlayTrigger,
	Row,
	Spinner,
	Tooltip,
} from "react-bootstrap";

import React from "react";
// import Tooltip from "react-bootstrap/Tooltip";
import env from "./environment";
import { fetchTitles } from "./utilities";

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
		page: 0,
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

	getTitlesAPIConfig = () => {
		const { settings, page, iteration } = this.state;
		const params = {
			page: page + 1,
			seq: iteration,
			page_size: settings.pageSize,
		};
		return params;
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

		this.registerInfiniteLoader();
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
		const params = this.getTitlesAPIConfig();
		fetchTitles(params).then(this.setTitles).catch(this.onRequestFail);
	};

	setTitles = (res) => {
		this.setState(
			{
				requestInProgress: false,
				page: this.state.page + 1,
				titles: [...this.state.titles, ...res.data.titles].slice(
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
					["name", "poster"],
					...titles.map((item) => {
						return [item.name, item.poster];
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
		const { selected, titles, settings, iteration } = this.state;
		return (
			<Container fluid>
				<Row className="justify-content-md-center page-title-row">
					<Col md={"auto"}>
						<h4 className="page-title-h4">
							Algorithm-{iteration + 1} Step 1/2: Select {settings.selectExact}{" "}
							titles
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
								key={item.name}
							>
								<Card.Body>
									<OverlayTrigger
										key={item.name}
										placement={"bottom"}
										overlay={
											<Tooltip id={"tooltip-bottom"}>
												<strong>{item.name}</strong>.
											</Tooltip>
										}
									>
										<Card.Img
											className={
												selected.has(item)
													? "survey-image-selected"
													: "survey-image-not-selected"
											}
											variant="top"
											src={`https://images.justwatch.com/poster/${item.poster}/s166`}
											alt={item.name}
										/>
									</OverlayTrigger>
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
