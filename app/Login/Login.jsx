import React, { Component } from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import onValueChange from '../ChangeHandler/ChangeHandler';
import style from '../Form.css';

export default class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.login = this.login.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  onKeyDown(event) {
    if (event.keyCode === 13) {
      return this.login();
    }
    return undefined;
  }

  login() {
    return DockerService.login(this.state.login, this.state.password)
      .then((data) => {
        browserHistory.push(this.props.redirect || '/');
        return data;
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
            name="login"
            type="text"
            placeholder="login"
            onKeyDown={this.onKeyDown}
            onChange={e => onValueChange(this, 'login')(e.target.value)}
          />
        </span>
        <span>
          <input
            name="password"
            type="password"
            placeholder="password"
            onKeyDown={this.onKeyDown}
            onChange={e => onValueChange(this, 'password')(e.target.value)}
          />
        </span>
        <span>
          <button className={style.styledButton} onClick={this.login}>
            Login
          </button>
        </span>
      </div>
    );
  }
}

Login.propTypes = {
  redirect: React.PropTypes.string,
};

