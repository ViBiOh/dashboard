import React from 'react';
import PropTypes from 'prop-types';
import style from './ContainerLogs.css';

/**
 * Container's logs.
 * @param {Object} props Props of the component.
 * @return {React.Component} Container's logs.
 */
const ContainerLogs = ({ logs }) => (
  <span className={style.container}>
    <h3>
Logs
    </h3>
    <pre className={style.code}>
      {logs.join('\n')}
    </pre>
  </span>
);

ContainerLogs.displayName = 'ContainerLogs';

ContainerLogs.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.string),
};

ContainerLogs.defaultProps = {
  logs: [],
};

export default ContainerLogs;
