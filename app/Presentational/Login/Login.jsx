import React from 'react';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import Button from '../../Presentational/Button/Button';
import style from './Login.css';

const Login = ({ onLogin, error }) => {
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
        <Button onClick={submit}>Login</Button>
      </Toolbar>
    </span>
  );
};

Login.displayName = 'Login';

Login.propTypes = {
  onLogin: React.PropTypes.func.isRequired,
  error: React.PropTypes.string,
};

Login.defaultProps = {
  error: '',
};

export default Login;
