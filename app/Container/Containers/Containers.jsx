import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import FaPlus from 'react-icons/lib/fa/plus';
import FaRefresh from 'react-icons/lib/fa/refresh';
import FaUserTimes from 'react-icons/lib/fa/user-times';
import DockerService from '../../Service/DockerService';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import Button from '../../Presentational/Button/Button';
import Throbber from '../../Presentational/Throbber/Throbber';
import ContainerCard from '../../Presentational/ContainerCard/ContainerCard';
import style from './Containers.css';

export default class Containers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };

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
    this.setState({ loaded: false, error: undefined });

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

  renderContainers() {
    let content;

    if (this.state.loaded) {
      content = (
        <div key="list" className={style.flex}>
          {
            this.state.containers.map(container => (
              <ContainerCard key={container.Id} container={container} />
            ))
          }
        </div>
      );
    } else {
      content = <Throbber label="Loading containers" error={this.state.error} />;
    }

    return (
      <span>
        <Toolbar error={this.state.error}>
          <Button onClick={this.fetchContainers}>
            <FaRefresh />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => browserHistory.push('/containers/New')}>
            <FaPlus />
            <span>Add an app</span>
          </Button>
          <span className={style.fill} />
          <Button
            onClick={() => DockerService.logout().then(this.fetchContainers)}
            type="danger"
          >
            <FaUserTimes />
            <span>Disconnect</span>
          </Button>
        </Toolbar>
        {content}
      </span>
    );
  }

  render() {
    return this.renderContainers();
  }
}
