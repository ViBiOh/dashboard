import React from 'react';
import style from './Containers.css';
import ContainerStatus from './ContainerStatus';

const ContainerRow = ({ container }) => (
  <span className={style.row}>
    <span className={style.id}>{container.Id.substring(0, 10)}</span>
    <span className={style.image}>{container.Image}</span>
    <span className={style.created}>
      {
        typeof container.Created === 'string'
        ? container.Created
        : new Date(container.Created * 1000).toUTCString()
      }
    </span>
    <ContainerStatus status={container.Status} />
    <span className={style.names}>{container.Names.join(', ')}</span>
  </span>
);

ContainerRow.displayName = 'ContainerRow';

ContainerRow.propTypes = {
  container: React.PropTypes.shape({
    Id: React.PropTypes.string.isRequired,
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
