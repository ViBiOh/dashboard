import React, { Component } from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import onValueChange from '../ChangeHandler/ChangeHandler';
import style from '../Form.css';

export default class ComposeForm extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.create = this.create.bind(this);
  }

  create() {
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
      <div className={style.form}>
        <span>
          <button
            className={style.styledButton}
            onClick={() => browserHistory.push('/')}
          >
            <FaArrowLeft /> Back
          </button>
        </span>
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
            placeholder="compose file yaml"
            onKeyDown={this.onKeyDown}
            rows={20}
            onChange={e => onValueChange(this, 'compose')(e.target.value)}
          />
        </span>
        <span>
          <button className={style.styledButton} onClick={this.create}>
            Create
          </button>
        </span>
        <div className={style.error}>
          {this.state.error}
        </div>
      </div>
    );
  }
}
