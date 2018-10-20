import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { FaExpand } from 'react-icons/fa';
import style from './ContainerLogs.css';

/**
 * Container's logs.
 * @param {Object} props Props of the component.
 * @return {React.Component} Container's logs.
 */
export default function ContainerLogs({ logs, toggleFullScreenLogs }) {
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

ContainerLogs.displayName = 'ContainerLogs';

ContainerLogs.propTypes = {
  logs: PropTypes.shape({
    logs: PropTypes.arrayOf(PropTypes.string),
    fullscreen: PropTypes.bool,
  }),
  toggleFullScreenLogs: PropTypes.func.isRequired,
};

ContainerLogs.defaultProps = {
  logs: {
    fullscreen: false,
    logs: [],
  },
};
