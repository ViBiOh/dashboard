import React from 'react';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import ThrobberButton from '../../Presentational/Throbber/ThrobberButton';
import style from './Login.css';

const Login = ({ login, onLoginChange, password, onPasswordChange, error, onLogin }) => {
  function onKeyDown(event) {
    if (event.keyCode === 13) {
      return onLogin();
    }
    return undefined;
  }

  return (
    <span className={style.flex}>
      <span>
        <input
          name="login"
          type="text"
          placeholder="login"
          value={login}
          onKeyDown={onKeyDown}
          onChange={e => onLoginChange(e.target.value)}
        />
      </span>
      <span>
        <input
          name="password"
          type="password"
          placeholder="password"
          value={password}
          onKeyDown={onKeyDown}
          onChange={e => onPasswordChange(e.target.value)}
        />
      </span>
      <Toolbar className={style.center} error={error}>
        <ThrobberButton onClick={onLogin}>Login</ThrobberButton>
      </Toolbar>
    </span>
  );
};

Login.displayName = 'Login';

Login.propTypes = {
  login: React.PropTypes.string,
  onLoginChange: React.PropTypes.func.isRequired,
  password: React.PropTypes.string,
  onPasswordChange: React.PropTypes.func.isRequired,
  onLogin: React.PropTypes.func.isRequired,
  error: React.PropTypes.string,
};

Login.defaultProps = {
  login: '',
  password: '',
  error: '',
};

export default Login;
