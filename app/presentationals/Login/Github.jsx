import React from 'react';
import FaGithub from 'react-icons/lib/fa/github';
import { getGithubOauthUrl } from '../../Constants';
import style from './Login.less';

const Github = () =>
  (<a
    href={getGithubOauthUrl()}
    className={style.icons}
    title="Login with GitHub"
    rel="noopener noreferrer"
    data-auth-github
  >
    <FaGithub />
  </a>);

Github.displayName = 'Github';

/**
 * Github Functional Component.
 */
export default Github;
