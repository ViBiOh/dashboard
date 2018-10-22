import React from 'react';
import PropTypes from 'prop-types';
import style from './index.css';

/**
 * Container's volumes informations.
 * @param {Object} props Props of the component.
 * @return {React.Component} Container's volumes information.
 */
export default function Volumes({ container }) {
  if (container.Mounts.length === 0) {
    return null;
  }

  return (
    <span className={style.container}>
      <h3>Volumes</h3>
      <span className={style.labels}>
        {container.Mounts.map(mount => (
          <span key={mount.Destination} className={style.item}>
            <em>{mount.Source}</em>
            {' '}
:
            {mount.Destination}
            {' '}
:
            <strong>{mount.Mode}</strong>
          </span>
        ))}
      </span>
    </span>
  );
}

Volumes.displayName = 'Volumes';

Volumes.propTypes = {
  container: PropTypes.shape({
    Mounts: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  }).isRequired,
};
