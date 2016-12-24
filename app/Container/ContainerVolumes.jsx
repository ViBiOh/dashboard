import React from 'react';
import style from './Containers.css';

const ContainerVolumes = ({ container }) => {
  if (container.Mounts.length === 0) {
    return null;
  }

  return (
    <span className={style.container}>
      <h3>Volumes</h3>
      <span className={style.labelsContainer}>
        {
          container.Mounts.map((mount, index) => (
            <span key={`mount${index}`} className={style.labelItem}>
              <em>{mount.Source}</em> : {mount.Destination} : <strong>{mount.Mode}</strong>
            </span>
          ))
        }
      </span>
    </span>
  );
};

ContainerVolumes.displayName = 'ContainerVolumes';

ContainerVolumes.propTypes = {
  container: React.PropTypes.shape({
    Mounts: React.PropTypes.arrayOf(React.PropTypes.shape({})).isRequired,
  }).isRequired,
};

export default ContainerVolumes;
