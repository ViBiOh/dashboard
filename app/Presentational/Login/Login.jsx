import React from 'react';
import Basic from './Basic';
import Github from './Github';
import style from './Login.less';

/**
 * Login form.
 * @param {Object} props Props of the component.
 * @return {React.Component} Login with username/password
 */
const Login = () =>
  (<span className={style.flex}>
    <h2>Login</h2>
    <div className={style.center}>
      <Basic />
      <Github />
    </div>
  </span>);

Login.displayName = 'Login';

export default Login;
