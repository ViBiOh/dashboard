import React from 'react';
import PropTypes from 'prop-types';
import style from './index.css';

/**
 * Toolbar for buttons.
 * @param {Object} props Props of the component.
 * @return {React.Component} Toolbar with children and message if provided
 */
const Toolbar = ({ children, className }) => (
  <span className={`${style.flex} ${className}`}>{children}</span>
);

Toolbar.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  className: PropTypes.string,
};

Toolbar.defaultProps = {
  children: null,
  className: '',
};

export default Toolbar;
