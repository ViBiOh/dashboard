import React from 'react';
import PropTypes from 'prop-types';
import style from './Throbber.less';

/**
 * Throbber for displaying background task.
 * @param {Object} props Props of the component.
 * @return {React.Component} Throbber with label and title if provided
 */
const Throbber = ({ label, title, className, vertical, horizontalSm }) =>
  (<div className={style.container} title={title}>
    {!vertical && label ? <span>{label}</span> : null}
    <div
      className={`${style.throbber} ${vertical && style.column} ${horizontalSm &&
        style['row-responsive']} ${className}`}
    >
      <div className={style.bounce1} />
      <div className={style.bounce2} />
      <div className={style.bounce3} />
    </div>
  </div>);

Throbber.displayname = 'Throbber';

Throbber.propTypes = {
  label: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
  vertical: PropTypes.bool,
  horizontalSm: PropTypes.bool,
};

Throbber.defaultProps = {
  label: '',
  title: '',
  className: '',
  vertical: false,
  horizontalSm: false,
};

export default Throbber;
