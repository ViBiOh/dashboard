import React from 'react';
import style from './Containers.css';

const ContainerInfo = ({ container }) => {
  let labelContent = null;
  if (Object.keys(container.Config.Labels).length > 0) {
    labelContent = [
      <h3 key="labelsHeader">Labels</h3>,
      <span key="labels" className={style.labelsContainer}>
        {
          Object.keys(container.Config.Labels).map(label => (
            <span key={label} className={style.labelItem}>
              {label} | {container.Config.Labels[label]}
            </span>
          ))
        }
      </span>,
    ];
  }

  return (
    <span className={style.container}>
      <h2>{container.Name}</h2>
      <span key="id" className={style.info}>
        <span className={style.label}>Id</span>
        <span>{container.Id.substring(0, 12)}</span>
      </span>
      <span key="created" className={style.info}>
        <span className={style.label}>Created</span>
        <span>{container.Created}</span>
      </span>
      <span key="status" className={style.info}>
        <span className={style.label}>Status</span>
        <span>{container.State.Status}</span>
      </span>
      <span key="image" className={style.info}>
        <span className={style.label}>Image</span>
        <span>{container.Config.Image}</span>
      </span>
      <span key="read-only" className={style.info}>
        <span className={style.label}>read-only</span>
        <span>{String(container.HostConfig.ReadonlyRootfs)}</span>
      </span>
      {labelContent}
    </span>
  );
};

ContainerInfo.displayName = 'ContainerInfo';

ContainerInfo.propTypes = {
  container: React.PropTypes.shape({
    Id: React.PropTypes.string.isRequired,
    Created: React.PropTypes.string.isRequired,
    State: React.PropTypes.shape({
      Status: React.PropTypes.string.isRequired,
    }).isRequired,
    Config: React.PropTypes.shape({
      Image: React.PropTypes.string.isRequired,
      Labels: React.PropTypes.shape({}).isRequired,
    }).isRequired,
    HostConfig: React.PropTypes.shape({
      ReadonlyRootfs: React.PropTypes.bool.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ContainerInfo;
