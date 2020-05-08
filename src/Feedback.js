import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";

import React from "react";
import env from "./environment";
import { storeData } from "./utilities";

const maxIterations = env.settings.maxIterations;

class Feedback extends React.Component {
	state = {
		showSubmitLoader: true,
		showLoader: true,
		finalFeedback: {
			prefferedAlgorithm: "The First One",
			willingToSpend: "The same time as was spent on these two algorithms",
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

		if (iteration + 1 !== maxIterations) {
			storeData({
				...this.props.location.state,
			});
			this.setState({ showSubmitLoader: false, trackTime: new Date() });
		} else {
			this.setState({ showSubmitLoader: false, trackTime: new Date() });
		}
	}

	onRequestFail = (err) => {
		console.log("Error Encountered", err);
		this.props.history.push("/");
	};

	endSurvey = () => {
		this.props.history.push("/end");
	};

	generateOptions = (field) => {
		if (field === "willingToSpend") {
			return [
				"No time at all",
				"Less time than was spent on these two algorithms",
				"The same time as was spent on these two algorithms",
				"More time than was spent on these two algorithms",
				"Much more time than was spent on these two algorithms",
			].map((i) => (
				<option value={i} key={i}>
					{i}
				</option>
			));
		}
		return ["The First One", "The Second One"].map((i) => (
			<option value={i} key={i}>
				{i}
			</option>
		));
	};

	onChoiceChange = (questionID, event) => {
		const { finalFeedback } = this.state;
		finalFeedback[questionID] = event.target.value;
		this.createEventLog(`Changed ${questionID} to ${event.target.value}`);
		this.setState({ finalFeedback });
	};

	nextPage = () => {
		const {
			region,
			iteration,
			key,
			sessionID,
			identifier,
			maxIterations,
		} = this.state;

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

	proceed = () => {
		const { iteration, maxIterations } = this.state;
		if (iteration + 1 !== maxIterations) {
			this.nextPage();
			return;
		}

		this.createEventLog("Clicked on Proceed", true, () => {
			this.setState({ showSubmitLoader: true }, () => {
				storeData({
					...this.props.location.state,
					finalFeedback: this.state.finalFeedback,
				})
					.then(() => {
						this.nextPage();
					})
					.catch(this.onRequestFail);
			});
		});
	};

	render() {
		const { iteration, showSubmitLoader, maxIterations } = this.state;
		const { prefferedAlgorithm, willingToSpend } = this.state.finalFeedback;
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
									{iteration + 1 !== maxIterations
										? `Algorithm ${
												iteration + 2
										  }: Now that you have completed that algorithm, please repeat the same steps for this new algorithm`
										: "Feedback"}
								</h4>
							</Col>
						</Row>

						{iteration + 1 === maxIterations && (
							<Row className="justify-content-md-center ">
								<Col md={"8"}>
									<div className="feedback-form">
										<Form onSubmit={this.proceed}>
											<Form.Group controlId="exampleForm.ControlInput1">
												<Form.Label>
													Pick which algorithm you like better
												</Form.Label>
												<Form.Control
													as="select"
													defaultValue={prefferedAlgorithm}
													onChange={(e) =>
														this.onChoiceChange("prefferedAlgorithm", e)
													}
												>
													{this.generateOptions("prefferedAlgorithm")}
												</Form.Control>
											</Form.Group>
											<Form.Group controlId="exampleForm.ControlInput2">
												<Form.Label>
													How much time would you be willing to spend answering
													questions prior to using a service, knowing that the
													more information you provide, the better your results
													will be?
												</Form.Label>
												<Form.Control
													as="select"
													defaultValue={willingToSpend}
													onChange={(e) =>
														this.onChoiceChange("willingToSpend", e)
													}
												>
													{this.generateOptions("willingToSpend")}
												</Form.Control>
											</Form.Group>
										</Form>
									</div>
								</Col>
							</Row>
						)}

						<Row className="survey-proceed-row">
							<Col xs={12} className="survey-proceed-col-items-center">
								<Button variant="success" size="lg" onClick={this.proceed}>
									Proceed
								</Button>
							</Col>
						</Row>
					</>
				)}
			</Container>
		);
	}
}

export default Feedback;
