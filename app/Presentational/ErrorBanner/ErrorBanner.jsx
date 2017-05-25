import React from 'react';
import PropTypes from 'prop-types';
import style from './ErrorBanner.less';

/**
 * Display error in a single line.
 * @param  {String} error Error to display
 * @return {ReactComponent} div with error or null if no error
 */
const ErrorBanner = ({ error }) => (error ? <div className={style.error}>{error}</div> : null);

ErrorBanner.displayName = 'ErrorBanner';

ErrorBanner.propTypes = {
  error: PropTypes.string,
};

ErrorBanner.defaultProps = {
  error: null,
};

export default ErrorBanner;
