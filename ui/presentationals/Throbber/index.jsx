import React from 'react';
import PropTypes from 'prop-types';
import style from './index.css';

/**
 * Throbber for displaying background task.
 * @param {Object} props Props of the component.
 * @return {React.Component} Throbber with label and title if provided
 */
const Throbber = ({ label, title, white, vertical, horizontalSm }) => (
  <div className={style.container} title={title}>
    {!vertical && label ? (
      <span>
        {label}
      </span>
) : null}
    <div
      className={`${style.throbber} ${white && style.white} ${vertical &&
        style.column} ${horizontalSm && style['row-responsive']}`}
    >
      <div className={style.bounce1} />
      <div className={style.bounce2} />
      <div className={style.bounce3} />
    </div>
  </div>
);

Throbber.displayname = 'Throbber';

Throbber.propTypes = {
  label: PropTypes.string,
  title: PropTypes.string,
  vertical: PropTypes.bool,
  white: PropTypes.bool,
  horizontalSm: PropTypes.bool,
};

Throbber.defaultProps = {
  label: '',
  title: '',
  vertical: false,
  white: false,
  horizontalSm: false,
};

export default Throbber;
