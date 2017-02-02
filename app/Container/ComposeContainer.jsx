import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import onValueChange from '../Utils/ChangeHandler/ChangeHandler';
import Compose from '../Presentational/Compose/Compose';

export default class ComposeContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.create = this.create.bind(this);
  }

  create() {
    this.setState({ error: undefined });

    return DockerService.create(this.state.name, this.state.compose)
      .then((data) => {
        browserHistory.push('/');
        return data;
      })
      .catch((error) => {
        this.setState({ error: error.content });
        return error;
      });
  }

  render() {
    return (
      <Compose
        name={this.state.name}
        onNameChange={onValueChange(this, 'name')}
        compose={this.state.compose}
        onComposeChange={onValueChange(this, 'compose')}
        onLogin={this.create}
        error={this.state.error}
      />
    );
  }
}
