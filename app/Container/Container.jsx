import React, { Component } from 'react';
import DockerService from '../Service/DockerService';
import Throbber from '../Throbber/Throbber';

export default class Containers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };

    this.fetchLogs = this.fetchLogs.bind(this);
  }

  componentDidMount() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.setState({ loaded: false });

    return DockerService.logs()
      .then(logs => this.setState({
        loaded: true,
        logs,
      }));
  }

  render() {
    if (this.state.loaded) {
      return (
        <div>
          {this.state.logs}
        </div>
      );
    }

    return <Throbber label="Loading logs" />;
  }
}
