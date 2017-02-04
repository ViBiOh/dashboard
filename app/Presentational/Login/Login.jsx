import React from 'react';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import ThrobberButton from '../../Presentational/Throbber/ThrobberButton';
import style from './Login.css';

const Login = ({ form, onChange, onLogin, error }) => {
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
          value={form.login}
          onKeyDown={onKeyDown}
          onChange={e => onChange(Object.assign({}, form, { login: e.target.value }))}
        />
      </span>
      <span>
        <input
          name="password"
          type="password"
          placeholder="password"
          value={form.password}
          onKeyDown={onKeyDown}
          onChange={e => onChange(Object.assign({}, form, { password: e.target.value }))}
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
  form: React.PropTypes.shape({
    login: React.PropTypes.string,
    password: React.PropTypes.string,
  }),
  onChange: React.PropTypes.func.isRequired,
  onLogin: React.PropTypes.func.isRequired,
  error: React.PropTypes.string,
};

Login.defaultProps = {
  form: {},
  error: '',
};

export default Login;
