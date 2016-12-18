import React, { Component } from 'react';
import DockerService from '../Container/DockerService';
import onValueChange from '../ChangeHandler/ChangeHandler';
import style from './Login.css';

export default class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.login = this.login.bind(this);
  }

  login() {
    DockerService.login(this.state.login, this.state.password);
  }

  render() {
    return (
      <form className={style.login}>
        <span>
          <input
            name="login"
            type="text"
            placeholder="login"
            onChange={onValueChange(this, 'login')}
          />
        </span>
        <span>
          <input
            name="password"
            type="password"
            placeholder="password"
            onChange={onValueChange(this, 'password')}
          />
        </span>
        <span>
          <input
            type="button"
            value="Login"
            onClick={this.login}
          />
        </span>
      </form>
    );
  }
}
