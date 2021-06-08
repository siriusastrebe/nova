import React, { Component } from 'react';
import { renderSpace } from './CosmosScene.js';
import './cosmos.css';

export default class Cosmos extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    renderSpace();
  }

  render() {
    return (
      <div>
        <div id="darkness">
          <div id="cosmosscene"></div>
          <div id="diagnostics">
            Load: <span id="workload"></span><br />
            Server Delay: <span id="serverDelay"></span><br />
            Ping: <span id="ping"></span><br />
            FPS: <span id="fps"></span>
          </div>
          <div id="chargeBar">
            <div id="chargeContainer">          
              <div id="chargeAmount">          
              </div>
            </div>
          </div>
          <div id="announcement">
            <h1 id="announcementTitle"></h1>
            <div id="announcementText"></div>
          </div>
          <div id="countdown">
            <div id="countdownText"></div>
          </div>
        </div>
      </div>
    );
  }
}
