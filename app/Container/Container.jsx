import React, { Component } from 'react';
import DockerService from '../Service/DockerService';
import Throbber from '../Throbber/Throbber';
import ContainerInfo from './ContainerInfo';
import ContainerNetwork from './ContainerNetwork';
import ContainerVolumes from './ContainerVolumes';
import ContainerLogs from './ContainerLogs';

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
