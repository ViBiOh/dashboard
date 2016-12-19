import React from 'react';
import style from './Containers.css';

const GREEN_STATUS = /up/i;

const ContainerStatus = ({ status }) => (
  <span
    className={style.status}
    style={{
      color: GREEN_STATUS.test(status) ? '#4cae4c' : '#d43f3a',
    }}
  >{status}</span>
);

ContainerStatus.displayName = 'ContainerStatus';

ContainerStatus.propTypes = {
  status: React.PropTypes.string.isRequired,
};

export default ContainerStatus;
