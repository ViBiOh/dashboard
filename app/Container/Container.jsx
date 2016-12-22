import React, { Component } from 'react';
import DockerService from '../Service/DockerService';
import Throbber from '../Throbber/Throbber';
import style from './Containers.css';

export default class Containers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };

    this.fetchInfos = this.fetchInfos.bind(this);
    this.fetchLogs = this.fetchLogs.bind(this);
  }

  componentDidMount() {
    Promise.all([this.fetchInfos(), this.fetchLogs()])
      .then(() => this.setState({ loaded: true }));
  }

  fetchInfos() {
    return DockerService.infos(this.props.params.containerId)
      .then(container => this.setState({
        container,
      }));
  }

  fetchLogs() {
    return DockerService.logs(this.props.params.containerId)
      .then(logs => this.setState({
        logs,
      }));
  }

  render() {
    if (this.state.loaded) {
      const { container, logs } = this.state;

      return (
        <span>
          <h2>{container.name}</h2>
          <span>Image: {container.Config.Image}</span>
          <h2>Logs</h2>
          <pre className={style.code}>
            {logs}
          </pre>
        </span>
      );
    }

    return <Throbber label="Loading logs" />;
  }
}

Containers.propTypes = {
  params: React.PropTypes.shape({
    containerId: React.PropTypes.string.isRequired,
  }).isRequired,
};
