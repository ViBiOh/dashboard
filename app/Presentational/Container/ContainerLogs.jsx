import React from 'react';
import PropTypes from 'prop-types';
import Button from '../Button/Button';
import style from './ContainerLogs.less';

/**
 * Container's logs.
 * @param {Object} props Props of the component.
 * @return {React.Component} Container's logs.
 */
const ContainerLogs = ({ logs, openLogs }) => {
  if (!logs) {
    return (
      <span className={style.container}>
        <Button className={style.button} onClick={openLogs}>Open logs...</Button>
      </span>
    );
  }

  return (
    <span className={style.container}>
      <h3>Logs</h3>
      <pre className={style.code}>
        {logs.join('\n')}
      </pre>
    </span>
  );
};

ContainerLogs.displayName = 'ContainerLogs';

ContainerLogs.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.string),
  openLogs: PropTypes.func.isRequired,
};

ContainerLogs.defaultProps = {
  logs: undefined,
};

export default ContainerLogs;
