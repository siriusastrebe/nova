import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import Cosmos from './cosmos.js';
import { addAsset, updateAsset, setControlledAsset, removeAsset, timer } from './CosmosScene.js';
import initializeFeathers from './feather-client.js';
initializeFeathers(addAsset, updateAsset, removeAsset, setControlledAsset, timer);

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/cosmos">
          Greater cosmos
        </Route>
        <Route path="/">
          <Cosmos />
        </Route>
      </Switch>
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
