import React from 'react';
import FaRefresh from 'react-icons/lib/fa/refresh';
import DockerService from '../Service/DockerService';
import style from './Containers.css';
import ContainerStatus from './ContainerStatus';

const ContainerRow = ({ container }) => (
  <span className={style.row}>
    <span className={style.created}>
      {
        typeof container.Created === 'string'
        ? container.Created
        : new Date(container.Created * 1000).toLocaleString()
      }
    </span>
    <span className={style.image}>{container.Image}</span>
    <ContainerStatus status={container.Status} />
    <span className={style.names}>{container.Names.join(', ')}</span>
    {
      DockerService.isLogged() &&
      <button className={style.icon} onClick={() => DockerService.restart(container.Id)}>
        <FaRefresh />
      </button>
    }
  </span>
);

ContainerRow.displayName = 'ContainerRow';

ContainerRow.propTypes = {
  container: React.PropTypes.shape({
    Image: React.PropTypes.string.isRequired,
    Created: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]).isRequired,
    Status: React.PropTypes.string.isRequired,
    Names: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  }).isRequired,
};

export default ContainerRow;
