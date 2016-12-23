import React from 'react';
import style from './Containers.css';

const ContainerVolumes = ({ container }) => (
  <span className={style.container}>
    <h3>Volumes</h3>
    {
      container.Mounts.map((mount, index) => (
        <span key={`volumes${index}`} className={style.info}>
          <span key="source" className={style.info}>
            <span className={style.label}>Source</span>
            <span>{mount.Source}</span>
          </span>
          <span key="destination" className={style.info}>
            <span className={style.label}>Destination</span>
            <span>{mount.Destination}</span>
          </span>
          <span key="mode" className={style.info}>
            <span className={style.label}>Mode</span>
            <span>{mount.Mode}</span>
          </span>
        </span>
      ))
    }
  </span>
);

ContainerVolumes.displayName = 'ContainerVolumes';

ContainerVolumes.propTypes = {
  container: React.PropTypes.shape({
    Mounts: React.PropTypes.arrayOf(React.PropTypes.shape({})).isRequired,
  }).isRequired,
};

export default ContainerVolumes;
