import React from 'react';
import PropTypes from 'prop-types';
import ErrorBanner from '../../ErrorBanner';
import style from './index.less';

const Wrapper = ({ component, error, ...rest }) => (
  <span className={style.container}>
    <ErrorBanner error={error} />
    <h2>Login</h2>
    {React.cloneElement(component, { error, ...rest })}
  </span>
);

Wrapper.displayName = 'Wrapper';

Wrapper.propTypes = {
  component: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
  error: PropTypes.string,
};

Wrapper.defaultProps = {
  error: '',
};

/**
 * Wrapper Functional Component.
 */
export default Wrapper;
