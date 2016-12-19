import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import onValueChange from '../ChangeHandler/ChangeHandler';
import style from './Login.css';

export default class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.login = this.login.bind(this);
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
      <form className={style.login}>
        <span>
          <input
            name="login"
            type="text"
            placeholder="login"
            onChange={e => onValueChange(this, 'login')(e.target.value)}
          />
        </span>
        <span>
          <input
            name="password"
            type="password"
            placeholder="password"
            onChange={e => onValueChange(this, 'password')(e.target.value)}
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

Login.propTypes = {
  redirect: React.PropTypes.string,
};

