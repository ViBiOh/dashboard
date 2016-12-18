import React, { Component } from 'react';
import DockerService from './DockerService';
import Throbber from '../Throbber/Throbber';

export default class Containers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };
  }

  componentDidMount() {
    this.fetchContainers();
  }

  fetchContainers() {
    return DockerService.containers()
      .then(containers => this.setState({
        loaded: true,
        containers,
      }));
  }

  renderContainers() {
    if (this.state.loaded) {
      const containers = this.state.containers.map(container => (
        <tr>
          <td>{container.Id}</td>
          <td>{container.Image}</td>
          <td>{container.Created}</td>
          <td>{container.Status}</td>
          <td>{container.Names}</td>
        </tr>
      ));

      return (
        <table>
          <thead>
            <tr>
              <td>Id</td>
              <td>Image</td>
              <td>Created</td>
              <td>Status</td>
              <td>Names</td>
            </tr>
          </thead>
          <tbody>
            {containers}
          </tbody>
        </table>
      );
    }
    return <Throbber label="Loading containers" />;
  }

  render() {
    return (
      <span>
        <h2>Containers</h2>
        {this.renderContainers()}
      </span>
    );
  }
}
