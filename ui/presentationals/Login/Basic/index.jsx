import React from 'react';
import PropTypes from 'prop-types';
import onKeyDown from '../../../utils/input';
import setRef from '../../../utils/ref';
import ThrobberButton from '../../Throbber/ThrobberButton';
import style from './index.css';

/**
 * Basic auth form.
 * @param {Object} props Props of the component.
 * @return {React.Component} Login with username/password
 */
export default function Basic({ redirect, pending, onLogin }) {
  const refs = {};

  function submit() {
    onLogin(refs.loginInput.value, refs.passwordInput.value, redirect);
  }

  return (
    <span className={style.container}>
      <input
        ref={e => setRef(refs, 'loginInput', e)}
        id="login"
        name="login"
        type="text"
        placeholder="login"
        onKeyDown={e => onKeyDown(e, submit)}
      />
      <input
        ref={e => setRef(refs, 'passwordInput', e)}
        id="password"
        name="password"
        type="password"
        placeholder="password"
        onKeyDown={e => onKeyDown(e, submit)}
      />
      <div className={style.buttons}>
        <ThrobberButton onClick={submit} pending={pending} data-basic-auth-submit>
          Login
        </ThrobberButton>
      </div>
    </span>
  );
}

Basic.displayName = 'Basic';

Basic.propTypes = {
  onLogin: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  redirect: PropTypes.string,
};

Basic.defaultProps = {
  pending: false,
  redirect: '',
};
