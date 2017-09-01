import React from 'react';
import PropTypes from 'prop-types';
import onKeyDown from '../../helpers/input';
import setRef from '../../helpers/ref';
import ThrobberButton from '../Throbber/ThrobberButton';
import ErrorBanner from '../ErrorBanner';
import style from './Login.less';

/**
 * BasicAuth auth form.
 * @param {Object} props Props of the component.
 * @return {React.Component} Login with username/password
 */
const BasicAuth = ({ pending, onLogin, error }) => {
  const refs = {};

  function submit() {
    onLogin(refs.loginInput.value, refs.passwordInput.value);
  }

  return (
    <span className={style.flex}>
      <ErrorBanner error={error} />
      <h2>Login</h2>
      <input
        ref={e => setRef(refs, 'loginInput', e)}
        name="login"
        type="text"
        placeholder="login"
        onKeyDown={e => onKeyDown(e, submit)}
      />
      <input
        ref={e => setRef(refs, 'passwordInput', e)}
        name="password"
        type="password"
        placeholder="password"
        onKeyDown={e => onKeyDown(e, submit)}
      />
      <div className={style.center}>
        <ThrobberButton onClick={submit} pending={pending}>
          Login
        </ThrobberButton>
      </div>
    </span>
  );
};

BasicAuth.displayName = 'BasicAuth';

BasicAuth.propTypes = {
  pending: PropTypes.bool,
  onLogin: PropTypes.func.isRequired,
  error: PropTypes.string,
};

BasicAuth.defaultProps = {
  pending: false,
  error: '',
};

export default BasicAuth;
