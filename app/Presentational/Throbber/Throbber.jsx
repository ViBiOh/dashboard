import React from 'react';
import style from './Throbber.css';

const Throbber = ({ label, className }) => (
  <div className={style.container}>
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
  label: React.PropTypes.string,
  className: React.PropTypes.string,
};

Throbber.defaultProps = {
  label: '',
  className: '',
};

export default Throbber;
