import React, { Component } from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import FaPlay from 'react-icons/lib/fa/play';
import FaStopCircle from 'react-icons/lib/fa/stop-circle';
import FaTrash from 'react-icons/lib/fa/trash';
import FaRefresh from 'react-icons/lib/fa/refresh';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import Button from '../Button/Button';
import Throbber from '../Throbber/Throbber';
import ContainerInfo from './ContainerInfo';
import ContainerNetwork from './ContainerNetwork';
import ContainerVolumes from './ContainerVolumes';
import ContainerLogs from './ContainerLogs';
import style from './Containers.css';

export default class Container extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };

    this.fetchInfos = this.fetchInfos.bind(this);
    this.action = this.action.bind(this);
  }

  componentDidMount() {
    this.fetchInfos();
  }

  fetchInfos() {
    return DockerService.infos(this.props.params.containerId)
      .then((container) => {
        this.setState({
          loaded: true,
          container,
        });

        return container;
      })
      .catch((error) => {
        this.setState({ error: error.content });
        return error;
      });
  }

  action(promise) {
    return promise
      .then(this.fetchInfos)
      .catch((error) => {
        this.setState({ error: error.content });
        return error;
      });
  }

  renderActions(container) {
    if (container.State.Running) {
      return [
        <button
          key="restart"
          className={style.styledButton}
          onClick={() => this.action(DockerService.restart(container.Id))}
        >
          <FaRefresh />
        </button>,
        <button
          key="stop"
          className={style.dangerButton}
          onClick={() => this.action(DockerService.stop(container.Id))}
        >
          <FaStopCircle />
        </button>,
      ];
    }
    return [
      <button
        key="start"
        className={style.styledButton}
        onClick={() => this.action(DockerService.start(container.Id))}
      >
        <FaPlay />
      </button>,
      <button
        key="delete"
        className={style.dangerButton}
        onClick={() => this.action(DockerService.delete(container.Id)).then(() =>
          browserHistory.push('/'))}
      >
        <FaTrash />
      </button>,
    ];
  }

  render() {
    if (!this.state.loaded) {
      return <Throbber label="Loading informations" error={this.state.error} />;
    }

    const { container } = this.state;

    return (
      <span>
        <div className={style.error}>{this.state.error}</div>
        <span className={style.flex}>
          <Button onClick={() => browserHistory.push('/')}>
            <FaArrowLeft /> Back
          </Button>
          <span className={style.growingFlex} />
          {this.renderActions(container)}
        </span>
        <ContainerInfo container={container} />
        <ContainerNetwork container={container} />
        <ContainerVolumes container={container} />
        <ContainerLogs containerId={this.props.params.containerId} />
      </span>
    );
  }
}

Container.propTypes = {
  params: React.PropTypes.shape({
    containerId: React.PropTypes.string.isRequired,
  }).isRequired,
};
