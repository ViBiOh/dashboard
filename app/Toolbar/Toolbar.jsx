import React from 'react';
import style from './Toolbar.css';

const Toolbar = ({ children, error, center }) => (
  <span className={`${style.flex} ${center ? style.center : ''}`}>
    {children}
    {
      error && <span className={style.error}>
        {error}
      </span>
    }
  </span>
);

Toolbar.propTypes = {
  error: React.PropTypes.string,
  center: React.PropTypes.bool,
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
};

Throbber.defaultProps = {
  error: '',
  center: false,
  children: '',
};

export default Toolbar;
