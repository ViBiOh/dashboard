import React, { Component } from 'react';
import DockerService from '../Service/DockerService';
import Throbber from '../Throbber/Throbber';
import style from './Container.css';

export default class ContainerLogs extends Component {
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
    return DockerService.logs(this.props.containerId)
      .then((logs) => {
        this.setState({
          loaded: true,
          logs,
        });

        return logs;
      })
      .catch((error) => {
        this.setState({ error: error.content });
        return error;
      });
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
      content = <Throbber label="Loading logs" error={this.state.error} />;
    }

    return (
      <span className={style.container}>
        <h2>Logs</h2>
        {content}
      </span>
    );
  }
}

ContainerLogs.propTypes = {
  containerId: React.PropTypes.string.isRequired,
};
