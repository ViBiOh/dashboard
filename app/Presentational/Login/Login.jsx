import React from 'react';
import { getFromContext } from '../../Constants';
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
      {getFromContext('BASIC_AUTH') && <Basic />}
      {getFromContext('GITHUB_OAUTH_CLIENT_ID') && <Github />}
    </div>
  </span>);

Login.displayName = 'Login';

export default Login;
