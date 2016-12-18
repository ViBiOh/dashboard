import React, { Component } from 'react';
import DockerService from './DockerService';
import ContainerRow from './ContainerRow';
import Throbber from '../Throbber/Throbber';
import style from './Containers.css';

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
      const header = {
        Id: 'Id',
        Image: 'Image',
        Created: 'Created',
        Status: 'Status',
        Names: ['Names'],
      };

      return (
        <div key="list" className={style.list}>
          <ContainerRow key={'header'} container={header} />
          {
            this.state.containers.map(container => (
              <ContainerRow key={container.Id} container={container} />
            ))
          }
        </div>
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
