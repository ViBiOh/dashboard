import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import FaPlus from 'react-icons/lib/fa/plus';
import FaRefresh from 'react-icons/lib/fa/refresh';
import FaUser from 'react-icons/lib/fa/user';
import FaUserTimes from 'react-icons/lib/fa/user-times';
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
      .then((containers) => {
        this.setState({
          loaded: true,
          containers,
        });

        return containers;
      });
  }

  actionContainer(promise) {
    return promise.then(this.fetchContainers);
  }

  renderContainers() {
    if (this.state.loaded) {
      return (
        <span>
          <button
            className={style.styledButton}
            onClick={this.fetchContainers}
          >
            <FaRefresh />
          </button>
          {
            DockerService.isLogged() && (
              <button
                className={style.styledButton}
                onClick={() => browserHistory.push('/containers/New')}
              >
                <FaPlus /> Add a compose
              </button>
            )
          }
          {
            !DockerService.isLogged() && (
              <button
                className={style.styledButton}
                onClick={() => browserHistory.push('/login')}
              >
                <FaUser />
              </button>
            )
          }
          {
            DockerService.isLogged() && (
              <button
                className={style.styledButton}
                onClick={DockerService.logout}
              >
                <FaUserTimes />
              </button>
            )
          }
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
