import React from 'react';
import PropTypes from 'prop-types';
import style from './ErrorBanner.less';

const ErrorBanner = ({ error }) => (error ? <div className={style.error}>{error}</div> : null);

ErrorBanner.displayName = 'ErrorBanner';

ErrorBanner.propTypes = {
  error: PropTypes.string,
};

ErrorBanner.defaultProps = {
  error: null,
};

export default ErrorBanner;
