import React, { Component } from 'react';
import DockerService from '../Service/DockerService';
import style from './Container.css';

export default class ContainerLogs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      logs: [],
    };

    this.appendLogs = this.appendLogs.bind(this);
    this.fetchLogs = this.fetchLogs.bind(this);
  }

  componentDidMount() {
    this.fetchLogs();
  }

  componentWillUnmount() {
    if (this.websocket) {
      this.websocket.send('close');
      this.websocket.close();
    }
  }

  appendLogs(log) {
    this.setState({
      logs: [...this.state.logs, log],
    });
  }

  fetchLogs() {
    try {
      this.websocket = DockerService.logs(this.props.containerId, this.appendLogs);
    } catch (e) {
      this.setState({ error: JSON.stringify(e, null, 2) });
    }
  }

  render() {
    return (
      <span className={style.container}>
        <h2>Logs</h2>
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
