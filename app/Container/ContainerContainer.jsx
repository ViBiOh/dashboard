import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import Container from '../Presentational/Container/Container';

export default class ContainerContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.fetchInfos = this.fetchInfos.bind(this);
    this.appendLogs = this.appendLogs.bind(this);
    this.fetchLogs = this.fetchLogs.bind(this);
    this.action = this.action.bind(this);
  }

  componentDidMount() {
    this.fetchInfos();
  }

  componentWillUnmount() {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  fetchInfos() {
    this.setState({ error: undefined });

    return DockerService.infos(this.props.params.containerId)
      .then((container) => {
        this.setState({ container });

        return container;
      })
      .catch((error) => {
        this.setState({ error: error.content });
        return error;
      });
  }

  appendLogs(log) {
    this.setState({
      logs: [...this.state.logs, log],
    });
  }

  fetchLogs() {
    try {
      this.setState({ logs: [] });
      this.websocket = DockerService.logs(this.props.params.containerId, this.appendLogs);
    } catch (e) {
      this.setState({
        error: JSON.stringify(e, null, 2),
      });
    }
  }

  action(promise) {
    this.setState({ error: undefined });

    return promise
      .then(this.fetchInfos)
      .catch((error) => {
        this.setState({ error: error.content });
        return error;
      });
  }

  render() {
    return (
      <Container
        container={this.state.container}
        logs={this.state.logs}
        fetchLogs={this.fetchLogs}
        onBack={() => browserHistory.push('/')}
        onRefresh={this.fetchInfos}
        onStart={containerId => this.action(DockerService.start(containerId))}
        onRestart={containerId => this.action(DockerService.restart(containerId))}
        onStop={containerId => this.action(DockerService.stop(containerId))}
        onDelete={containerId => this.action(DockerService.delete(containerId)).then(() =>
            browserHistory.push('/'))}
        error={this.state.error}
      />
    );
  }
}

ContainerContainer.propTypes = {
  params: React.PropTypes.shape({
    containerId: React.PropTypes.string.isRequired,
  }).isRequired,
};
