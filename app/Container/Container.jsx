import React, { Component } from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import FaPlay from 'react-icons/lib/fa/play';
import FaStopCircle from 'react-icons/lib/fa/stop-circle';
import FaTrash from 'react-icons/lib/fa/trash';
import FaRefresh from 'react-icons/lib/fa/refresh';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
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
  }

  componentDidMount() {
    this.fetchInfos();
  }

  fetchInfos() {
    return DockerService.infos(this.props.params.containerId)
      .then(container => this.setState({
        loaded: true,
        container,
      }));
  }

  render() {
    if (!this.state.loaded) {
      return <Throbber label="Loading informations" />;
    }

    const { container } = this.state;

    return (
      <span>
        <span className={style.flex}>
          <button
            className={style.styledButton}
            onClick={() => browserHistory.push('/')}
          >
            <FaArrowLeft /> Back
          </button>
          <span className={style.growingFlex} />
          {
            container.State.Running && DockerService.isLogged() && [
              <button
                key="restart"
                className={style.styledButton}
                onClick={() => action(DockerService.restart(container.Id))}
              >
                <FaRefresh />
              </button>,
              <button
                key="stop"
                className={style.dangerButton}
                onClick={() => action(DockerService.stop(container.Id))}
              >
                <FaStopCircle />
              </button>,
            ]
          }
          {
            !container.State.Running && DockerService.isLogged() && [
              <button
                key="start"
                className={style.styledButton}
                onClick={() => action(DockerService.start(container.Id))}
              >
                <FaPlay />
              </button>,
              <button
                key="delete"
                className={style.dangerButton}
                onClick={() => action(DockerService.delete(container.Id))}
              >
                <FaTrash />
              </button>,
            ]
          }
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
