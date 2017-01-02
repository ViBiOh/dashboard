import React from 'react';
import style from './Throbber.css';

const Throbber = ({ label, error }) => (
  <div className={style.throbberContainer}>
    {label && <span>{label}</span>}
    <div className={style.throbber}>
      <div className={style.bounce1} />
      <div className={style.bounce2} />
      <div className={style.bounce3} />
    </div>
    {
      error && <div className={style.error}>{error}</div>
    }
  </div>
);

Throbber.propTypes = {
  label: React.PropTypes.string,
  error: React.PropTypes.string,
};

Throbber.displayname = 'Throbber';

export default Throbber;
