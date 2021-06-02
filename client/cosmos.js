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
            FPS: <span id="fps"></span><br />
            Ping: <span id="ping"></span>
          </div>
          <div id="chargeBar">
            <div id="chargeContainer">          
              <div id="chargeAmount">          
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
