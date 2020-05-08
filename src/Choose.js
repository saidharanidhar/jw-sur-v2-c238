import "./global.css";

import {
	Button,
	Card,
	Col,
	Container,
	Form,
	OverlayTrigger,
	Row,
	Spinner,
	Tooltip,
} from "react-bootstrap";

import React from "react";
import ScrollMenu from "react-horizontal-scrolling-menu";
import env from "./environment";
import { getRecommendations } from "./utilities";

const chooseSettings = env.settings.choose;
const maxIterations = env.settings.maxIterations;

class Choose extends React.Component {
	state = {
		titles: [],
		eventlogs: [],
		trackTime: null,
		selected: new Set(),
		requestInProgress: false,
		settings:
			chooseSettings[this.props.location.state.iteration] || chooseSettings[0],
		feedback: {
			personalizedChoices: "1",
			watchTonight: "1",
			alreadySeen: "NO",
			comparision: "The same",
		},
		...this.props.location.state,
	};

	setPerferencesAPIConfig = () => {
		const { surveyData, settings } = this.state;
		const data = {
			titles_required: settings.showExact,
			selection: surveyData.selected.map((item) => item.name),
		};
		return data;
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

		const data = this.setPerferencesAPIConfig();
		getRecommendations(data)
			.then(this.processTitlesData)
			.catch(this.onRequestFail);
	}

	processTitlesData = (res) => {
		const titles = res.data.titles;
		this.setState({ titles }, () => {
			this.createEventLog("Titles Loaded", true);
		});
	};

	onRequestFail = (err) => {
		console.log("Error Encountered", err);
		this.props.history.push("/");
	};

	endSurvey = () => {
		this.props.history.push("/end");
	};

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

	getScrollButtons = () => {
		return ["fa-chevron-left", "fa-chevron-right"].map((type, index) => {
			return (
				<Button
					size="lg"
					variant="warning"
					className="choose-horizontal-scroll-button"
					onClick={() => {
						this.createEventLog(
							`Clicked ${index === 0 ? "LEFT" : "RIGHT"} button `,
							true
						);
					}}
				>
					<i className={`fa ${type}`} style={{ color: "#ffffff" }} />
				</Button>
			);
		});
	};

	getScrollData = () => {
		const { selected, titles } = this.state;
		return titles.map((item, index) => {
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
										? "survey-image survey-image-selected"
										: "survey-image survey-image-not-selected"
								}
								variant="top"
								src={`https://images.justwatch.com/poster/${item.poster}/s166`}
								alt={item.name}
							/>
						</OverlayTrigger>
					</Card.Body>
				</Card>
			);
		});
	};

	nextPage = (data) => {
		const { region, iteration, feedback } = this.state;

		this.props.history.push({
			pathname: `/${region}/${iteration}/feedback`,
			state: {
				...this.props.location.state,
				choiceData: data,
				feedbackData: feedback,
			},
		});
	};

	proceed = (event) => {
		this.createEventLog("Clicked on Proceed", true, () => {
			const {
				titles,
				selected,
				eventlogs,
				settings,
				trackTime,
				totalRequests,
			} = this.state;
			if (selected.size === settings.selectExact) {
				const titlesCompressed = [
					["name", "poster"],
					...titles.map((item) => {
						return [item.name, item.poster];
					}),
				];
				const data = {
					settings,
					eventlogs,
					totalRequests,
					selected: [...selected],
					titles: titlesCompressed,
					duration: new Date() - trackTime,
				};
				this.nextPage(data);
			}
		});
	};

	generateCards = () => {
		const scrollData = this.getScrollData();
		const buttons = this.getScrollButtons();

		return (
			<Col md={12}>
				<ScrollMenu
					scrollBy={5}
					wheel={false}
					data={scrollData}
					hideArrows={true}
					itemClassActive=""
					hideSingleArrow={true}
					arrowLeft={buttons[0]}
					arrowRight={buttons[1]}
				/>
			</Col>
		);
	};

	generateOptions = (isBoolean = false) => {
		if (isBoolean === "comparision") {
			return [
				"Much better",
				"Slightly better",
				"The same",
				"Slightly worse",
				"Much worse",
			].map((i) => (
				<option value={i} key={i}>
					{i}
				</option>
			));
		}

		if (isBoolean) {
			return ["YES", "NO"].map((i) => (
				<option value={i} key={i}>
					{i}
				</option>
			));
		}
		const options = [];
		for (var i = 1; i <= 10; i++) {
			options.push(
				<option value={i} key={i}>
					{i}
				</option>
			);
		}
		return options;
	};

	onChoiceChange = (questionID, event) => {
		const { feedback } = this.state;
		feedback[questionID] = event.target.value;
		this.createEventLog(`Changed ${questionID} to ${event.target.value}`);
		this.setState({ feedback });
	};

	render() {
		const { titles, settings, selected, iteration, feedback } = this.state;

		const {
			personalizedChoices,
			watchTonight,
			alreadySeen,
			comparision,
		} = feedback;
		return (
			<Container fluid>
				<Row className="justify-content-md-center page-title-row">
					<Col md={"auto"}>
						<h4 className="page-title-h4">
							Algorithm-{iteration + 1} Step 2/2: Choose {settings.selectExact}{" "}
							titles from the recommendation
						</h4>
					</Col>
				</Row>

				{titles.length === 0 ? (
					<Spinner animation="border" variant="warning" />
				) : (
					<>
						<Row>
							<Col md={"auto"}>
								<h5 className="choose-scroll-name">Based on your selection</h5>
							</Col>
							{this.generateCards()}
						</Row>
						<Row className="justify-content-md-center ">
							<Col md={"auto"}>
								<div className="feedback-form">
									<Form onSubmit={this.proceed}>
										<Form.Group controlId="exampleForm.ControlInput1">
											<Form.Label>
												Rate the personalized movie choices
											</Form.Label>
											<Form.Control
												as="select"
												defaultValue={personalizedChoices}
												onChange={(e) =>
													this.onChoiceChange("personalizedChoices", e)
												}
											>
												{this.generateOptions()}
											</Form.Control>
										</Form.Group>
										<Form.Group controlId="exampleForm.ControlSelect1">
											<Form.Label>
												Rate how happy you would be to watch this movie tonight
											</Form.Label>
											<Form.Control
												as="select"
												defaultValue={watchTonight}
												onChange={(e) => this.onChoiceChange("watchTonight", e)}
											>
												{this.generateOptions()}
											</Form.Control>
										</Form.Group>
										<Form.Group controlId="exampleForm.ControlSelect2">
											<Form.Label>
												Is movie the one you have seen before?
											</Form.Label>
											<Form.Control
												as="select"
												defaultValue={alreadySeen}
												onChange={(e) => this.onChoiceChange("alreadySeen", e)}
											>
												{this.generateOptions(true)}
											</Form.Control>
										</Form.Group>
										<Form.Group controlId="exampleForm.ControlSelect3">
											<Form.Label>
												How would you compare the above choices to what you are
												shown on your current streaming services?
											</Form.Label>
											<Form.Control
												as="select"
												defaultValue={comparision}
												onChange={(e) => this.onChoiceChange("comparision", e)}
											>
												{this.generateOptions("comparision")}
											</Form.Control>
										</Form.Group>
									</Form>
								</div>
							</Col>
						</Row>
					</>
				)}
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

export default Choose;
