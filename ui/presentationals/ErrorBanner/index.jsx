import React from 'react';
import PropTypes from 'prop-types';
import style from './index.css';

/**
 * Display error in a single line.
 * @param  {String} error Error to display
 * @return {ReactComponent} div with error or null if no error
 */
const ErrorBanner = ({ error }) => {
  if (error) {
    return (
      <div data-error className={style.error}>
        {error}
      </div>
    );
  }
  return null;
};

ErrorBanner.displayName = 'ErrorBanner';

ErrorBanner.propTypes = {
  error: PropTypes.string,
};

ErrorBanner.defaultProps = {
  error: null,
};

export default ErrorBanner;
