import React from 'react';
import style from './Toolbar.css';

const Toolbar = ({ children }) => (
  <span className={style.flex}>
    {children}
  </span>
);

Toolbar.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
};

export default Toolbar;
