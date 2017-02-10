import React from 'react';
import Button from '../Button/Button';
import style from './ContainerLogs.css';

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
  logs: React.PropTypes.arrayOf(React.PropTypes.string),
  openLogs: React.PropTypes.func.isRequired,
};

ContainerLogs.defaultProps = {
  logs: undefined,
};

export default ContainerLogs;
