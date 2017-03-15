import React from 'react';
import style from './Toolbar.css';

/**
 * Toolbar for buttons and error message.
 * @param {Object} props Props of the component.
 * @return {React.Component} Toolbar with children and message if provided
 */
const Toolbar = ({ children, className, error }) => (
  <span className={`${style.flex} ${className}`}>
    {children}
    {
      error && (
        <span className={style.error}>
          {error}
        </span>
      )
    }
  </span>
);

Toolbar.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
  className: React.PropTypes.string,
  error: React.PropTypes.string,
};

Toolbar.defaultProps = {
  children: null,
  className: '',
  error: '',
};

export default Toolbar;
