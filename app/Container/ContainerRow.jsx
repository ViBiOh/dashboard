import React from 'react';
import { browserHistory } from 'react-router';
import FaPlay from 'react-icons/lib/fa/play';
import FaStop from 'react-icons/lib/fa/stop';
import FaRefresh from 'react-icons/lib/fa/refresh';
import FaEye from 'react-icons/lib/fa/eye';
import DockerService from '../Service/DockerService';
import style from './Containers.css';

const GREEN_STATUS = /up/i;

const ContainerRow = ({ container, action }) => {
  const isUp = GREEN_STATUS.test(container.Status);

  return (
    <span className={style.row}>
      <span className={style.created}>
        {
          typeof container.Created === 'string'
          ? container.Created
          : new Date(container.Created * 1000).toString()
        }
      </span>
      <span className={style.image}>{container.Image}</span>
      <span className={style.status} style={{ color: isUp ? '#4cae4c' : '#d43f3a' }}>
        {container.Status}
      </span>
      <span className={style.names}>{container.Names.join(', ')}</span>
      {
        DockerService.isLogged() &&
          <button
            key="logs"
            className={style.icon}
            onClick={() => browserHistory.push(`/${container.Id}`)}
          >
            <FaEye />
          </button>
      }
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
        !isUp && DockerService.isLogged() &&
          <button
            key="start"
            className={style.icon}
            onClick={() => action(DockerService.start(container.Id))}
          >
            <FaPlay />
          </button>
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
