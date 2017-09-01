import React from 'react';
import FaUnlockAlt from 'react-icons/lib/fa/unlock-alt';
import style from './Login.less';

const Basic = () =>
  (<a
    href="/auth/basic"
    className={style.icons}
    title="Login with username/password"
    rel="noopener noreferrer"
  >
    <FaUnlockAlt />
  </a>);

Basic.displayName = 'Basic';

/**
 * Basic Functional Component.
 */
export default Basic;
