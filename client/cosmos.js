import React, { Component } from 'react';
import { renderSpace } from './CosmosScene.js';
import './cosmos.css';

export default class Cosmos extends Component {
  constructor(props) {
    super(props);
    this.state = {siriusOpacity: 0};
  }

  componentDidMount() {
    renderSpace();
  }

  render() {
    return (
      <div>
        <div id="darkness">
          <div id="cosmosscene"></div>
          <div id="vitals">
            Load: <span id="workload"></span><br />
            FPS: <span id="fps"></span><br />
            Ping: <span id="ping"></span>
          </div>
        </div>
      </div>
    );
  }
}
