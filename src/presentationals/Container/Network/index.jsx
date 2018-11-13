import React from 'react';
import PropTypes from 'prop-types';
import style from './index.css';

/**
 * Container's network informations.
 * @param {Object} props Props of the component.
 * @return {React.Component} Container's network information.
 */
export default function Network({ container }) {
  const networkContent =
    container.NetworkSettings.Networks &&
    Object.keys(container.NetworkSettings.Networks).map(network => (
      <span key={network} className={style.item}>
        {network}
        {' | '}
        {container.NetworkSettings.Networks[network].IPAddress}
      </span>
    ));

  const linkContent =
    container.NetworkSettings.Networks &&
    []
      .concat(
        ...Object.keys(container.NetworkSettings.Networks)
          .map(networkName => container.NetworkSettings.Networks[networkName])
          .filter(network => network.Links)
          .map(network => network.Links),
      )
      .map(link => link.split(':'))
      .filter(parts => parts.length > 1)
      .map(parts => (
        <span key={parts[1]} className={style.item}>
          {parts[0]}
          {' | '}
          {parts[1]}
        </span>
      ));

  const portContent =
    container.NetworkSettings.Ports &&
    Object.keys(container.NetworkSettings.Ports)
      .filter(port => container.NetworkSettings.Ports[port])
      .map(port => (
        <span key={port} className={style.item}>
          {port}
          {' | '}
          {container.NetworkSettings.Ports[port].map(p => p.HostPort).join(', ')}
        </span>
      ));

  return (
    <span className={style.container}>
      {networkContent &&
        networkContent.length > 0 && (
          <>
            <h3>Networks</h3>
            <span className={style.labels}>{networkContent}</span>
          </>
        )}
      {portContent &&
        portContent.length > 0 && (
          <>
            <h3>Ports</h3>
            <span className={style.labels}>{portContent}</span>
          </>
        )}
      {linkContent &&
        linkContent.length > 0 && (
          <>
            <h3>Links</h3>
            <span className={style.labels}>{linkContent}</span>
          </>
        )}
    </span>
  );
}

Network.displayName = 'Network';

Network.propTypes = {
  container: PropTypes.shape({
    NetworkSettings: PropTypes.shape({
      Ports: PropTypes.shape({}),
      Networks: PropTypes.shape({}),
    }).isRequired,
  }).isRequired,
};
