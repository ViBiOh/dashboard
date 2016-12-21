import React from 'react';
import style from './Main.css';

const Main = ({ children }) => (
  <span className={style.mainLayout}>
    <article>{children}</article>
  </span>
);

Main.propTypes = {
  children: React.PropTypes.element.isRequired,
};

export default Main;
