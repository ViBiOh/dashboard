import React from 'react';
import style from './Main.css';

const Main = ({ children }) => (
  <span className={style.layout}>
    <article className={style.article}>{children}</article>
  </span>
);

Main.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]).isRequired,
};

export default Main;
