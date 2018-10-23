import React from 'react';
import PropTypes from 'prop-types';
import { FaUnlockAlt, FaGithub } from 'react-icons/fa';
import { getFromContext, getGithubOauthUrl } from 'Constants';
import SearchParams, { computeRedirectSearch } from 'utils/SearchParams';
import style from './index.css';

/**
 * Login form.
 * @param {Object} props Props of the component.
 * @return {React.Component} Login with username/password
 */
export default function Login({ location }) {
  const { redirect } = SearchParams(location.search);

  return (
    <span className={style.flex}>
      <h2>Login</h2>
      <div className={style.center}>
        {getFromContext('BASIC_AUTH_ENABLED') === 'true' && (
          <a
            href={`/auth/basic${computeRedirectSearch(redirect)}`}
            className={style.icons}
            title="Login with username/password"
            rel="noopener noreferrer"
            data-login-basic
          >
            <FaUnlockAlt />
          </a>
        )}
        {getFromContext('GITHUB_AUTH_ENABLED') === 'true' && (
          <a
            href={getGithubOauthUrl(redirect)}
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
}

Login.displayName = 'Login';

Login.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }),
};

Login.defaultProps = {
  location: {},
};
