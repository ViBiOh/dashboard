import React, { Component } from 'react';
import DockerService from '../Service/DockerService';
import Throbber from '../Throbber/Throbber';
import style from './Containers.css';

export default class ContainerLogs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };

    this.fetchLogs = this.fetchLogs.bind(this);
  }

  fetchLogs() {
    return DockerService.logs(this.props.containerId)
      .then(logs => this.setState({
        logs,
      }));
  }

  render() {
    let content;
    if (this.state.loaded) {
      content = (
        <pre className={style.code}>
          {this.state.logs.join('\n')}
        </pre>
      );
    } else {
      content = <Throbber label="Loading logs" />;
    }

    return (
      <span>
        <h2>Logs</h2>
        {content}
      </span>
    );
  }
}

ContainerLogs.propTypes = {
  containerId: React.PropTypes.string.isRequired,
};
