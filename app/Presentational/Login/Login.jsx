import React from 'react';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import ThrobberButton from '../../Presentational/Throbber/ThrobberButton';
import style from './Login.css';

const Login = ({ pending, onLogin, error }) => {
  let loginInput;
  let passwordInput;

  function submit() {
    return onLogin(loginInput.value, passwordInput.value);
  }

  function onKeyDown(event) {
    if (event.keyCode === 13) {
      return submit();
    }
    return undefined;
  }

  return (
    <span className={style.flex}>
      <h2>Login</h2>
      <input
        ref={e => (loginInput = e)}
        name="login"
        type="text"
        placeholder="login"
        onKeyDown={onKeyDown}
      />
      <input
        ref={e => (passwordInput = e)}
        name="password"
        type="password"
        placeholder="password"
        onKeyDown={onKeyDown}
      />
      <Toolbar className={style.center} error={error}>
        <ThrobberButton onClick={submit} pending={pending}>Login</ThrobberButton>
      </Toolbar>
    </span>
  );
};

Login.displayName = 'Login';

Login.propTypes = {
  pending: React.PropTypes.bool,
  onLogin: React.PropTypes.func.isRequired,
  error: React.PropTypes.string,
};

Login.defaultProps = {
  pending: false,
  error: '',
};

export default Login;
