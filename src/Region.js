import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { generateSession, sendRequest } from "./utilities";

import React from "react";
import env from "./environment";

class Region extends React.Component {
	state = {
		region: "en_US",
		countryMap: [],
		showLoader: true,
	};

	componentDidMount() {
		const url = "https://apis.justwatch.com/content/locales/state";
		sendRequest("get", url, "", this.onSuccess, this.onFailure);
	}

	onSuccess = (res) => {
		var countryMap = res.data
			.map((item) => {
				return { key: item.full_locale, value: item.country };
			})
			.sort((a, b) => {
				if (env.settings.topOnRegion.includes(a.key)) return -1;
				if (env.settings.topOnRegion.includes(b.key)) return 1;

				if (a.value === b.value) return 0;
				if (a.value < b.value) return -1;
				return 1;
			});
		this.setState({ countryMap, showLoader: false });
	};

	onFailure = (err) => {
		console.log("errr");
		console.log(err);
	};

	generateOptions = () => {
		return this.state.countryMap.map((item) => (
			<option value={item.key} key={item.key}>
				{item.value}
			</option>
		));
	};

	handleRegionChange = (e) => {
		this.setState({ region: e.target.value });
	};

	proceed = (e) => {
		const { region } = this.state;
		this.props.history.push({
			pathname: `/${region}/0/survey`,
			state: {
				region,
				iteration: 0,
				key: "SecretKey",
				sessionID: generateSession(),
				identifier: env.settings.identifier,
				maxIterations: env.settings.maxIterations,
			},
		});
	};

	render() {
		const { showLoader, region } = this.state;
		const countryOptions = this.generateOptions();
		return (
			<Container fluid>
				<Row className="justify-content-md-center page-title-row">
					<Col md={"auto"}>
						<h4 className="page-title-h4">Welcome</h4>
					</Col>
				</Row>

				{showLoader ? (
					<Spinner animation="border" variant="warning" />
				) : (
					<Row className="justify-content-md-center">
						<Col md="auto">
							<h4>Select Your Region</h4>
						</Col>
						<Col md="auto">
							<Form.Control
								as="select"
								defaultValue={region}
								onChange={this.handleRegionChange}
							>
								{countryOptions}
							</Form.Control>
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
			</Container>
		);
	}
}

export default Region;
