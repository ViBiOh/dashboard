import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { FaExpand } from 'react-icons/fa';
import style from './index.css';

/**
 * Container's logs.
 * @param {Object} props Props of the component.
 * @return {React.Component} Container's logs.
 */
export default function Logs({ logs, toggleFullScreenLogs }) {
  const codeClasses = classnames({
    [style.code]: true,
    [style['code--full-screen']]: logs.fullscreen,
  });

  const expandClasses = classnames({
    [style.expand]: true,
    [style['expand--full-screen']]: logs.fullscreen,
  });

  return (
    <span className={style.container}>
      <h3>Logs</h3>
      <pre className={codeClasses}>
        {logs.logs.join('\n')}

        <span
          className={expandClasses}
          role="button"
          tabIndex="0"
          onClick={toggleFullScreenLogs}
          onKeyUp={toggleFullScreenLogs}
        >
          <FaExpand />
        </span>
      </pre>
    </span>
  );
}

Logs.displayName = 'Logs';

Logs.propTypes = {
  logs: PropTypes.shape({
    logs: PropTypes.arrayOf(PropTypes.string),
    fullscreen: PropTypes.bool,
  }),
  toggleFullScreenLogs: PropTypes.func.isRequired,
};

Logs.defaultProps = {
  logs: {
    fullscreen: false,
    logs: [],
  },
};
