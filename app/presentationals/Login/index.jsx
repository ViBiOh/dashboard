import React from 'react';
import FaUnlockAlt from 'react-icons/lib/fa/unlock-alt';
import FaGithub from 'react-icons/lib/fa/github';
import { getFromContext, getGithubOauthUrl } from '../../Constants';
import style from './index.less';

/**
 * Login form.
 * @param {Object} props Props of the component.
 * @return {React.Component} Login with username/password
 */
const Login = () => (
  <span className={style.flex}>
    <h2>Login</h2>
    <div className={style.center}>
      {getFromContext('BASIC_AUTH_ENABLED') === 'true' && (
        <a
          href="/auth/basic"
          className={style.icons}
          title="Login with username/password"
          rel="noopener noreferrer"
          data-login-basic
        >
          <FaUnlockAlt />
        </a>
      )}
      {getFromContext('GITHUB_OAUTH_CLIENT_ID') && (
        <a
          href={getGithubOauthUrl()}
          className={style.icons}
          title="Login with GitHub"
          rel="noopener noreferrer"
          data-login-github
        >
          <FaGithub />
        </a>
      )}
    </div>
  </span>
);

Login.displayName = 'Login';

export default Login;
