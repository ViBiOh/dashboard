import React from 'react';
import PropTypes from 'prop-types';
import style from './Throbber.css';

/**
 * Throbber for displaying background task.
 * @param {Object} props Props of the component.
 * @return {React.Component} Throbber with label and title if provided
 */
const Throbber = ({ label, title, className }) => (
  <div className={style.container} title={title}>
    {label && <span>{label}</span>}
    <div className={`${style.throbber} ${className}`}>
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
  className: PropTypes.string,
};

Throbber.defaultProps = {
  label: '',
  title: '',
  className: '',
};

export default Throbber;
