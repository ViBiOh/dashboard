import React, { Component } from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import FaPlay from 'react-icons/lib/fa/play';
import FaStopCircle from 'react-icons/lib/fa/stop-circle';
import FaTrash from 'react-icons/lib/fa/trash';
import FaRefresh from 'react-icons/lib/fa/refresh';
import FaRetweet from 'react-icons/lib/fa/retweet';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import Toolbar from '../Toolbar/Toolbar';
import Button from '../Button/Button';
import Throbber from '../Throbber/Throbber';
import ThrobberButton from '../Throbber/ThrobberButton';
import ContainerInfo from './ContainerInfo';
import ContainerNetwork from './ContainerNetwork';
import ContainerVolumes from './ContainerVolumes';
import ContainerLogs from './ContainerLogs';
import style from './Container.css';

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
    this.setState({ loaded: false, error: undefined });

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
    this.setState({ error: undefined });

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
        <ThrobberButton
          key="restart"
          onClick={() => this.action(DockerService.restart(container.Id))}
        >
          <FaRetweet />
          <span>Restart</span>
        </ThrobberButton>,
        <ThrobberButton
          key="stop"
          type="danger"
          onClick={() => this.action(DockerService.stop(container.Id))}
        >
          <FaStopCircle />
          <span>Stop</span>
        </ThrobberButton>,
      ];
    }
    return [
      <ThrobberButton
        key="start"
        onClick={() => this.action(DockerService.start(container.Id))}
      >
        <FaPlay />
        <span>Start</span>
      </ThrobberButton>,
      <ThrobberButton
        key="delete"
        type="danger"
        onClick={() => this.action(DockerService.delete(container.Id)).then(() =>
          browserHistory.push('/'))}
      >
        <FaTrash />
        <span>Delete</span>
      </ThrobberButton>,
    ];
  }

  render() {
    const { container, loaded } = this.state;

    let content;
    if (loaded) {
      content = [
        <ContainerInfo container={container} />,
        <ContainerNetwork container={container} />,
        <ContainerVolumes container={container} />,
        <ContainerLogs containerId={this.props.params.containerId} />,
      ];
    } else {
      content = <Throbber label="Loading informations" error={this.state.error} />;
    }

    return (
      <span>
        <Toolbar error={this.state.error}>
          <Button onClick={() => browserHistory.push('/')}>
            <FaArrowLeft />
            <span>Back</span>
          </Button>
          <Button onClick={this.fetchInfos}>
            <FaRefresh />
            <span>Refresh</span>
          </Button>
          <span className={style.growingFlex} />
          {loaded && this.renderActions(container)}
        </Toolbar>
        {content}
      </span>
    );
  }
}

Container.propTypes = {
  params: React.PropTypes.shape({
    containerId: React.PropTypes.string.isRequired,
  }).isRequired,
};
