import React from 'react';
import PropTypes from 'prop-types';
import onKeyDown from '../../Tools/input';
import setRef from '../../Tools/ref';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import ThrobberButton from '../../Presentational/Throbber/ThrobberButton';
import style from './Login.css';

/**
 * Login form.
 * @param {Object} props Props of the component.
 * @return {React.Component} Login with username/password
 */
const Login = ({ pending, onLogin, error }) => {
  const refs = {};

  function submit() {
    onLogin(refs.loginInput.value, refs.passwordInput.value);
  }

  return (
    <span className={style.flex}>
      <h2>Login</h2>
      <input
        ref={e => setRef(refs, 'loginInput', e)}
        name="login"
        type="text"
        placeholder="login"
        onKeyDown={e => onKeyDown(e, submit)}
      />
      <input
        ref={e => setRef(refs, 'passwordInput', e)}
        name="password"
        type="password"
        placeholder="password"
        onKeyDown={e => onKeyDown(e, submit)}
      />
      <Toolbar className={style.center} error={error}>
        <ThrobberButton onClick={submit} pending={pending}>Login</ThrobberButton>
      </Toolbar>
    </span>
  );
};

Login.displayName = 'Login';

Login.propTypes = {
  pending: PropTypes.bool,
  onLogin: PropTypes.func.isRequired,
  error: PropTypes.string,
};

Login.defaultProps = {
  pending: false,
  error: '',
};

export default Login;
