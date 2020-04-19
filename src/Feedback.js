import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";

import React from "react";
import env from "./environment";
import { storeData } from "./utilities";

const maxIterations = env.settings.maxIterations;

class Feedback extends React.Component {
	state = {
		showSubmitLoader: false,
		showLoader: true,
		feedback: {
			personalizedChoices: "1",
			watchTonight: "1",
			alreadySeen: "NO",
		},
		eventlogs: [],
		trackTime: null,
		...this.props.location.state,
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

	componentDidMount() {
		const { key, iteration } = this.state;
		if (key !== "SecretKey") {
			this.onRequestFail();
			return;
		}

		if (iteration >= maxIterations) {
			this.endSurvey();
			return;
		}
		this.setState({ showLoader: false, trackTime: new Date() });
	}

	onRequestFail = (err) => {
		console.log("Error Encountered", err);
		this.props.history.push("/");
	};

	endSurvey = () => {
		this.props.history.push("/end");
	};

	generateOptions = (isBoolean = false) => {
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

	nextPage = () => {
		const { region, iteration, key, sessionID, identifier } = this.state;

		const nextState = {
			key,
			region,
			sessionID,
			identifier,
			maxIterations,
			iteration: iteration + 1,
		};

		this.props.history.push({
			pathname: `/${region}/${nextState.iteration}/survey`,
			state: nextState,
		});
	};

	proceed = (e) => {
		this.setState({ showLoader: true });
		this.createEventLog("Clicked on Proceed", true, () => {
			const {
				feedback,
				eventlogs,
				trackTime,
				iteration,
				maxIterations,
			} = this.state;
			const data = {
				eventlogs,
				feedback,
				duration: new Date() - trackTime,
			};

			const submission = storeData({
				feedbackData: data,
				...this.props.location.state,
			});

			if (iteration + 1 === maxIterations) {
				this.setState({ showSubmitLoader: true });
				submission.then(this.nextPage).catch(this.nextPage);
			} else {
				this.nextPage();
			}
		});
	};

	render() {
		const {
			iteration,
			showLoader,
			showSubmitLoader,
			maxIterations,
		} = this.state;
		const {
			personalizedChoices,
			watchTonight,
			alreadySeen,
		} = this.state.feedback;
		return (
			<Container fluid>
				{showSubmitLoader ? (
					<>
						<h3>Saving...</h3>
						<Spinner animation="grow" variant="warning" />
					</>
				) : (
					<>
						<Row className="justify-content-md-center page-title-row">
							<Col md={"auto"}>
								<h4 className="page-title-h4">
									Step {iteration * 3 + 3}/{maxIterations * 3}: Questionary
								</h4>
							</Col>
						</Row>
						{showLoader ? (
							<Spinner animation="border" variant="warning" />
						) : (
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
													Rate how happy you would be to watch this movie
													tonight
												</Form.Label>
												<Form.Control
													as="select"
													defaultValue={watchTonight}
													onChange={(e) =>
														this.onChoiceChange("watchTonight", e)
													}
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
													onChange={(e) =>
														this.onChoiceChange("alreadySeen", e)
													}
												>
													{this.generateOptions(true)}
												</Form.Control>
											</Form.Group>
										</Form>
									</div>
								</Col>
							</Row>
						)}
						{!showLoader && (
							<Row className="survey-proceed-row">
								<Col xs={12} className="survey-proceed-col-items-center">
									<Button variant="success" size="lg" onClick={this.proceed}>
										Proceed
									</Button>
								</Col>
							</Row>
						)}
					</>
				)}
			</Container>
		);
	}
}

export default Feedback;
