import React, { Component } from 'react';
import DockerService from '../Service/DockerService';
import ContainerRow from './ContainerRow';
import Throbber from '../Throbber/Throbber';
import style from './Containers.css';

export default class Containers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };
    
    this.fetchContainers = this.fetchContainers.bind(this);
    this.actionContainer = this.actionContainer.bind(this);
  }

  componentDidMount() {
    this.fetchContainers();
  }

  fetchContainers() {
    this.setState({ loaded: false });

    return DockerService.containers()
      .then(containers => this.setState({
        loaded: true,
        containers,
      }));
  }
  
  actionContainer(promise) {
    return promise.then(this.fetchContainers);
  }

  renderContainers() {
    if (this.state.loaded) {
      const header = {
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
              <ContainerRow key={container.Id} container={container} action={this.actionContainer} />
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
