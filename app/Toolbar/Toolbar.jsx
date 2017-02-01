import React from 'react';
import style from './Toolbar.css';

const Toolbar = ({ wrapperClassName, children, error, center }) => (
  <span className={`${style.flex} ${wrapperClassName} ${center ? style.center : ''}`}>
    {children}
    {
      error && <span className={style.error}>
        {error}
      </span>
    }
  </span>
);

Toolbar.propTypes = {
  wrapperClassName: React.PropTypes.string,
  error: React.PropTypes.string,
  center: React.PropTypes.bool,
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
};

Toolbar.defaultProps = {
  wrapperClassName: '',
  error: '',
  center: false,
  children: '',
};

export default Toolbar;
