import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Throbber from '../../Throbber';

/**
 * Github Component.
 */
export default class Github extends Component {
  /**
   * React lifecycle.
   * If no error provided, exhcange code for access token
   */
  componentDidMount() {
    if (!this.props.error) {
      this.props.getAccessToken(this.props.state, this.props.code, this.props.redirect);
    }
  }

  /**
   * React lifecycle.
   * Show Throbber or ErrorBanner for explaining
   * @return {ReactComponent} Component
   */
  render() {
    if (!this.props.error) {
      return <Throbber label="Getting access token" />;
    }

    return null;
  }
}

Github.propTypes = {
  code: PropTypes.string,
  error: PropTypes.string,
  getAccessToken: PropTypes.func.isRequired,
  redirect: PropTypes.string,
  state: PropTypes.string,
};

Github.defaultProps = {
  code: '',
  error: '',
  pending: false,
  redirect: '',
  state: '',
};
