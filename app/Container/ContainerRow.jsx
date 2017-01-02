import React from 'react';
import moment from 'moment';
import { browserHistory } from 'react-router';
import FaPlay from 'react-icons/lib/fa/play';
import FaStop from 'react-icons/lib/fa/stop';
import FaRefresh from 'react-icons/lib/fa/refresh';
import FaEye from 'react-icons/lib/fa/eye';
import FaTrashO from 'react-icons/lib/fa/trash-o';
import DockerService from '../Service/DockerService';
import style from './Containers.css';

const GREEN_STATUS = /up/i;

const ContainerRow = ({ container, action }) => {
  const isUp = GREEN_STATUS.test(container.Status);

  return (
    <span className={style.row}>
      <pre>{container.Id.substring(0, 12)}</pre>
      <span className={style.fluid}>{container.Image}</span>
      <span className={style.fluid}>{container.Command}</span>
      <span className={style.created}>
        {moment.unix(container.Created).fromNow()}
      </span>
      <span className={style.fluid} style={{ color: isUp ? '#4cae4c' : '#d43f3a' }}>
        {container.Status}
      </span>
      <span className={style.fluid}>{container.Names.join(', ')}</span>
      <button
        key="logs"
        className={`${style.icon} ${style.success}`}
        onClick={() => browserHistory.push(`/containers/${container.Id}`)}
      >
        <FaEye />
      </button>
      {
        isUp && DockerService.isLogged() && [
          <button
            key="restart"
            className={`${style.icon} ${style.primary}`}
            onClick={() => action(DockerService.restart(container.Id))}
          >
            <FaRefresh />
          </button>,
          <button
            key="stop"
            className={`${style.icon} ${style.stop}`}
            onClick={() => action(DockerService.stop(container.Id))}
          >
            <FaStop />
          </button>,
        ]
      }
      {
        !isUp && DockerService.isLogged() && [
          <button
            key="start"
            className={style.icon}
            onClick={() => action(DockerService.start(container.Id))}
          >
            <FaPlay />
          </button>,
          <button
            key="delete"
            className={`${style.icon} ${style.stop}`}
            onClick={() => action(DockerService.delete(container.Id))}
          >
            <FaTrash />
          </button>
        ]
      }
    </span>
  );
};

ContainerRow.displayName = 'ContainerRow';

ContainerRow.propTypes = {
  action: React.PropTypes.func,
  container: React.PropTypes.shape({
    Image: React.PropTypes.string.isRequired,
    Created: React.PropTypes.number.isRequired,
    Status: React.PropTypes.string.isRequired,
    Names: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  }).isRequired,
};

export default ContainerRow;
