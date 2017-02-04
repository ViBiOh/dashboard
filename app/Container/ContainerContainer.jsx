import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import Container from '../Presentational/Container/Container';

export default class ContainerContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.fetchInfos = this.fetchInfos.bind(this);
    this.action = this.action.bind(this);
  }

  componentDidMount() {
    this.fetchInfos();
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
