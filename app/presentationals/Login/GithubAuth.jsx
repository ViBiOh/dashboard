import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ErrorBanner from '../ErrorBanner';
import Throbber from '../Throbber';

/**
 * GithubAuth Component.
 */
export default class GithubAuth extends Component {
  /**
   * If no error provided, exhcange code for access token
   */
  componentDidMount() {
    if (!this.props.error) {
      this.props.getAccessToken(this.props.state, this.props.code);
    }
  }

  /**
   * Show Throbber or ErrorBanner for explaining
   * @return {ReactComponent} Component
   */
  render() {
    if (this.props.error) {
      return <ErrorBanner error={this.props.error} />;
    }
    if (this.props.pending) {
      return <Throbber label="Getting access token" />;
    }

    return null;
  }
}

GithubAuth.propTypes = {
  getAccessToken: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  state: PropTypes.string,
  code: PropTypes.string,
  error: PropTypes.string,
};

GithubAuth.defaultProps = {
  pending: false,
  state: '',
  code: '',
  error: '',
};
