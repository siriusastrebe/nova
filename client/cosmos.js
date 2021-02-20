import React, { Component } from 'react';
import { renderSpace } from './CosmosScene.js';

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
        </div>
      </div>
    );
  }
}
