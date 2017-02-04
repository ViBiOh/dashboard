import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import ContainersList from '../Presentational/ContainersList/ContainersList';

export default class ContainersListContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.fetchContainers = this.fetchContainers.bind(this);
  }

  componentWillMount() {
    this.mounted = true;
  }

  componentDidMount() {
    this.fetchContainers();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetchContainers() {
    this.setState({ error: undefined });

    return DockerService.containers()
      .then((containers) => {
        if (this.mounted) {
          this.setState({
            loaded: true,
            containers,
          });
        }

        return containers;
      })
      .catch((error) => {
        if (this.mounted) {
          this.setState({ error: error.content });
        }

        return error;
      });
  }

  render() {
    return (
      <ContainersList
        containers={this.state.containers}
        error={this.state.error}
        onRefresh={this.fetchContainers}
        onAdd={() => browserHistory.push('/containers/New')}
        onLogout={() => DockerService.logout().then(browserHistory.push('/login'))}
      />
    );
  }
}
