import React from 'react';
import PropTypes from 'prop-types';
import style from './Main.less';

/**
 * Component wrapper for App.
 * @param {Object} props Props of the component.
 * @return {React.Component} Wrapper of App
 */
const Main = ({ children }) =>
  (<span className={style.layout}>
    <article className={style.article}>{children}</article>
  </span>);

Main.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export default Main;
