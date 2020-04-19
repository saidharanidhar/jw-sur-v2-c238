import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { Route, BrowserRouter as Router, Switch } from "react-router-dom";

import Choose from "./Choose";
import Feedback from "./Feedback";
import React from "react";
import Region from "./Region";
import Survey from "./Survey";
import Thankyou from "./Thankyou";

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<Router>
					<Switch>
						<Route path="/end" component={Thankyou} />
						<Route path="/:region/:iteration/feedback" component={Feedback} />
						<Route path="/:region/:iteration/choose" component={Choose} />
						<Route path="/:region/:iteration/survey" component={Survey} />
						<Route path="/" component={Region} />
					</Switch>
				</Router>
			</header>
		</div>
	);
}

export default App;
