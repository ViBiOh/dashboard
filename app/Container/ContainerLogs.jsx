import React, { Component } from 'react';
import DockerService from '../Service/DockerService';
import Button from '../Button/Button';
import style from './Container.css';

export default class ContainerLogs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      websocketOpen: false,
      logs: [],
    };

    this.appendLogs = this.appendLogs.bind(this);
    this.fetchLogs = this.fetchLogs.bind(this);
  }

  componentWillUnmount() {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  appendLogs(log) {
    this.setState({
      logs: [...this.state.logs, log],
    });
  }

  fetchLogs() {
    this.setState({ websocketOpen: true });
    try {
      this.websocket = DockerService.logs(this.props.containerId, this.appendLogs);
    } catch (e) {
      this.setState({
        error: JSON.stringify(e, null, 2),
        websocketOpen: false,
      });
    }
  }

  render() {
    if (!this.state.websocketOpen) {
      return (
        <span className={style.container}>
          <Button onClick={this.fetchLogs}>Fetch logs...</Button>
        </span>
      );
    }

    return (
      <span className={style.container}>
        <h3>Logs</h3>
        <pre className={style.code}>
          {this.state.logs.join('\n')}
        </pre>
      </span>
    );
  }
}

ContainerLogs.propTypes = {
  containerId: React.PropTypes.string.isRequired,
};
