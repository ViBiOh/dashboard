import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import ThrobberButton from '../../Presentational/Throbber/ThrobberButton';
import DockerService from '../../Service/DockerService';
import onValueChange from '../../Utils/ChangeHandler/ChangeHandler';
import style from './Login.css';

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
    this.setState({ error: undefined });

    return DockerService.login(this.state.login, this.state.password)
      .then((data) => {
        browserHistory.push(this.props.redirect || '/');
        return data;
      })
      .catch((error) => {
        this.setState({ error: error.content });
        return error;
      });
  }

  render() {
    return (
      <span className={style.flex}>
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
        <Toolbar center error={this.state.error}>
          <ThrobberButton onClick={this.login}>
            Login
          </ThrobberButton>
        </Toolbar>
      </span>
    );
  }
}

Login.propTypes = {
  redirect: React.PropTypes.string,
};

Login.defaultProps = {
  redirect: '',
};
