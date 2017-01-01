import React, { Component } from 'react';
import FaPlus from 'react-icons/lib/fa/plus';
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
      return (
        <span>
          <button className={style.styledButton}>
            <FaPlus /> Add a container
          </button>
          <div key="list" className={style.list}>
            {
              this.state.containers.map(container => (
                <ContainerRow
                  key={container.Id}
                  container={container}
                  action={this.actionContainer}
                />
              ))
            }
          </div>
        </span>
      );
    }

    return <Throbber label="Loading containers" />;
  }

  render() {
    return this.renderContainers();
  }
}
