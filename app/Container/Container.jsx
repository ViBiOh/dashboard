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

    this.fetchLogs = this.fetchLogs.bind(this);
  }

  componentDidMount() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.setState({ loaded: false });

    return DockerService.logs(this.props.params.containerId)
      .then(logs => this.setState({
        loaded: true,
        logs,
      }));
  }

  render() {
    if (this.state.loaded) {
      return (
        <span>
          <h2>Logs</h2>
          <pre className={style.code}>
            {this.state.logs}
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
