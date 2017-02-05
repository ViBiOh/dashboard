import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import DockerService from '../Service/DockerService';
import Login from '../Presentational/Login/Login';

export default class LoginContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.login = this.login.bind(this);
  }

  login(login, password) {
    this.setState({ error: undefined });

    return DockerService.login(login, password)
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
      <Login onLogin={this.login} error={this.state.error} />
    );
  }
}

LoginContainer.propTypes = {
  redirect: React.PropTypes.string,
};

LoginContainer.defaultProps = {
  redirect: '',
};
