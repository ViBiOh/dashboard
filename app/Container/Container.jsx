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
          <h2>{container.Name}</h2>
          <span key="id" className={style.info}>
            <span className={style.label}>Id</span>
            <span>{container.Id.substring(0, 10)}</span>
          </span>
          <span key="status" className={style.info}>
            <span className={style.label}>Status</span>
            <span>{container.State.Status}</span>
          </span>
          <span key="image" className={style.info}>
            <span className={style.label}>Image</span>
            <span>{container.Config.Image}</span>
          </span>
          <h2>Volumes</h2>
          {
            container.Mounts.map((mount, index) => (
              <span key={`volumes${index}`} className={style.info}>
                <span key="source" className={style.info}>
                  <span className={style.label}>Source</span>
                  <span>{mount.Source}</span>
                </span>
                <span key="destination" className={style.info}>
                  <span className={style.label}>Destination</span>
                  <span>{mount.Destination}</span>
                </span>
                <span key="mode" className={style.info}>
                  <span className={style.label}>Mode</span>
                  <span>{mount.Mode}</span>
                </span>
              </span>
            ))
          }
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
