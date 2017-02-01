import React from 'react';
import style from './Toolbar.css';

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
