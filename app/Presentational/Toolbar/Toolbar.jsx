import React from 'react';
import PropTypes from 'prop-types';
import style from './Toolbar.less';

/**
 * Toolbar for buttons and error message.
 * @param {Object} props Props of the component.
 * @return {React.Component} Toolbar with children and message if provided
 */
const Toolbar = ({ children, className, error }) => (
  <span className={`${style.flex} ${className}`}>
    {children}
    {error &&
      <span className={style.error}>
        {error}
      </span>}
  </span>
);

Toolbar.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  className: PropTypes.string,
  error: PropTypes.string,
};

Toolbar.defaultProps = {
  children: null,
  className: '',
  error: '',
};

export default Toolbar;
