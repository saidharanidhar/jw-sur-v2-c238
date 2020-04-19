import "./global.css";

import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";

import React from "react";
import ScrollMenu from "react-horizontal-scrolling-menu";
import env from "./environment";
import { sendRequest } from "./utilities";

const chooseSettings = env.settings.choose;
const maxIterations = env.settings.maxIterations;

class Choose extends React.Component {
	state = {
		titles: [],
		eventlogs: [],
		trackTime: null,
		pageRequests: 0,
		totalRequests: 0,
		selected: new Set(),
		requestInProgress: false,
		settings:
			chooseSettings[this.props.location.state.iteration] || chooseSettings[0],
		...this.props.location.state,
	};

	scrollRef = React.createRef();

	setPerferencesAPIConfig = () => {
		const { region, sessionID, surveyData } = this.state;
		const url = `https://apis.justwatch.com/discovery/taste_survey/${region}/next_titles?justwatch_id=${sessionID}`;
		const data = {
			count: 0,
			fields: [],
			new_liked_jw_entity_ids: surveyData.selected.map(
				(item) => item.jw_entity_id
			),
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

		const { url, data, method } = this.setPerferencesAPIConfig();
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
			rootMargin: "100px",
			threshold: [0.25, 0.75, 1],
		};
		const observer = new IntersectionObserver(
			this.handleInfiniteLoaderTrigger,
			config
		);
		observer.observe(this.scrollRef.current);
	};

	getRecommendationAPIConfig = (from, to, newSession) => {
		const { region, sessionID } = this.state;
		const url = `https://apis.justwatch.com/discovery/modules/${region}/current?justwatch_id=${sessionID}`;
		const data = {
			fields: ["id", "object_type", "title", "poster"],
			supported_module_templates: [
				"MOOD_SELECTOR",
				"MOVIES_CLASSICS",
				"MOVIES_HIGHLY_RATED",
				"MOVIES_POPULAR",
				"MOVIES_TRENDING",
				"NEW_MOVIES",
				"NEW_TITLES",
				"NEW_TV_SHOWS",
				"TITLES_BECAUSE_YOU_LOVED_TITLE",
				"TITLES_BUY_RENT",
				"TITLES_BY_MOOD",
				"TITLES_EXPLORE_NEW_GENRES",
				"TITLES_FAVORITE_GENRE",
				"TITLES_FREE",
				"TITLES_HIDDEN_GEM",
				"TITLES_HIGHLY_RATED",
				"TITLES_SIMILAR_TO_TAG",
				"TITLES_TOP_PICKS",
				"TITLES_TRENDING_BY_PROVIDER",
				"TITLES_TRENDING",
				"TITLES_WATCHED_BY_SIMILAR_USERS",
				"TITLES_WATCHLIST",
				"TOP_MOVIES",
				"TOP_TV_SHOWS",
				"TV_SHOWS_HIGHLY_RATED",
				"TV_SHOWS_POPULAR",
				"TV_SHOWS_TRENDING",
				"TV_SHOWS_TRACKING",
			],
			force_new_discovery_session: newSession,
			popularity_sprinkling: "",
			release_date_sprinkling: "",
			filter_content_type: "",
			filter_popularity: "",
			filter_rating: "",
			filter_year: [],
			from,
			to,
		};
		return { url, data, method: "post" };
	};

	handleInfiniteLoaderTrigger = (entries) => {
		entries.forEach((entry) => {
			if (
				this.state.requestInProgress ||
				entry.intersectionRatio === 0 ||
				this.state.titles.length >= this.state.settings.maxCategories
			)
				return;
			this.getTitles();
		});
	};

	getTitles = () => {
		const { pageRequests } = this.state;
		const from = pageRequests * 4;
		const to = from + 3;
		const newSession = from === 0;

		const { url, data, method } = this.getRecommendationAPIConfig(
			from,
			to,
			newSession
		);

		this.setState({ requestInProgress: true }, () => {
			this.createEventLog("Loading Titles");
			sendRequest(
				method,
				url,
				data,
				this.processTitlesData,
				this.onRequestFail
			);
		});
	};

	processTitlesData = (res) => {
		const items = res.data.items;
		const processedData = [];
		items.forEach((item) => {
			if (item.titles && item.template.translations.title) {
				processedData.push({
					category: item.template.translations.title,
					items: item.titles.slice(0, this.state.settings.showMaxPerCategory),
				});
			}
		});

		this.setState(
			{
				requestInProgress: items.length === 0 ? true : false,
				titles: [...this.state.titles, ...processedData].slice(
					0,
					this.state.settings.maxCategories
				),
				pageRequests: items.length === 0 ? 0 : this.state.pageRequests + 1,
				totalRequests: this.state.totalRequests + 1,
			},
			() => {
				if (
					(this.state.pageRequests === 0 ||
						document.documentElement.scrollHeight - window.innerHeight < 500) &&
					this.state.titles.length < this.state.settings.maxCategories
				) {
					this.createEventLog(
						"Titles Loaded are less, auto triggering again",
						true,
						this.getTitles
					);

					return;
				}
				this.createEventLog("Titles Loaded", true);
			}
		);
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

	getScrollButtons = (rowIndex) => {
		return ["fa-chevron-left", "fa-chevron-right"].map((type, index) => {
			return (
				<Button
					size="lg"
					variant="warning"
					className="choose-horizontal-scroll-button"
					onClick={() => {
						this.createEventLog(
							`Clicked ${
								index === 0 ? "LEFT" : "RIGHT"
							} button on row ${rowIndex}`,
							true
						);
					}}
				>
					<i className={`fa ${type}`} style={{ color: "#ffffff" }} />
				</Button>
			);
		});
	};

	getScrollData = (data, rowIndex) => {
		const { selected } = this.state;
		return data.items.map((item, index) => {
			item["index"] = index;
			item["rowIndex"] = rowIndex;
			item["category"] = data.category;
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
									? "survey-image survey-image-selected"
									: "survey-image survey-image-not-selected"
							}
							variant="top"
							src={
								item.poster &&
								`https://images.justwatch.com${item.poster.replace(
									"{profile}",
									"s166"
								)}`
							}
							alt={item.title}
						/>
					</Card.Body>
				</Card>
			);
		});
	};

	nextPage = (data) => {
		const { region, iteration } = this.state;

		this.props.history.push({
			pathname: `/${region}/${iteration}/feedback`,
			state: {
				...this.props.location.state,
				choiceData: data,
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
				const titlesCompressed = titles.map((row) => {
					return {
						category: row.category,
						items: [
							["jw_entity_id", "title", "poster", "object_type"],
							...row.items.map((item) => {
								return [
									item.jw_entity_id,
									item.title,
									item.poster,
									item.object_type,
								];
							}),
						],
					};
				});
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

	render() {
		const { titles, settings, selected, iteration, maxIterations } = this.state;
		return (
			<Container fluid>
				<Row className="justify-content-md-center page-title-row">
					<Col md={"auto"}>
						<h4 className="page-title-h4">
							Step {iteration * 3 + 2}/{maxIterations * 3}: Choose{" "}
							{settings.selectExact} titles from the recommendation
						</h4>
					</Col>
				</Row>
				{titles.map((data, rowIndex) => {
					const scrollData = this.getScrollData(data, rowIndex);
					const buttons = this.getScrollButtons(rowIndex);
					return (
						<Row key={rowIndex}>
							<Col md={"auto"}>
								<h5 className="choose-scroll-name">{data.category}</h5>
							</Col>
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
						</Row>
					);
				})}
				<div className="survey-infinite-scroll-div" ref={this.scrollRef}>
					{titles.length >= settings.maxCategories ? (
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

export default Choose;
