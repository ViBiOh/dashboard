import React, { Component } from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import Toolbar from '../Toolbar/Toolbar';
import Button from '../Button/Button';
import ThrobberButton from '../Throbber/ThrobberButton';
import onValueChange from '../ChangeHandler/ChangeHandler';
import style from './Compose.css';

export default class ComposeForm extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.create = this.create.bind(this);
  }

  create() {
    this.setState({ error: undefined });

    return DockerService.create(this.state.name, this.state.compose)
      .then((data) => {
        browserHistory.push('/');
        return data;
      })
      .catch((error) => {
        this.setState({ error: error.content });
        return error;
      });
  }

  render() {
    return (
      <div className={style.flex}>
        <Toolbar error={this.state.error}>
          <Button onClick={() => browserHistory.push('/')}>
            <FaArrowLeft />
            <span>Back</span>
          </Button>
        </Toolbar>
        <span>
          <input
            name="name"
            type="text"
            placeholder="name"
            onChange={e => onValueChange(this, 'name')(e.target.value)}
          />
        </span>
        <span>
          <textarea
            className={style.code}
            placeholder="compose file yaml v2"
            onKeyDown={this.onKeyDown}
            rows={20}
            onChange={e => onValueChange(this, 'compose')(e.target.value)}
          />
        </span>
        <span>
          <ThrobberButton onClick={this.create}>
            Create
          </ThrobberButton>
        </span>
      </div>
    );
  }
}
