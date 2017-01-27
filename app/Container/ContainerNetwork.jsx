import React from 'react';
import style from './Container.css';

const ContainerNetwork = ({ container }) => {
  if ((container.NetworkSettings.Networks &&
       Object.keys(container.NetworkSettings.Networks).length === 0) &&
    (container.NetworkSettings.Ports &&
     Object.keys(container.NetworkSettings.Ports).length === 0)) {
    return null;
  }

  const linkContent = [].concat(...Object.keys(container.NetworkSettings.Networks)
    .map(networkName => container.NetworkSettings.Networks[networkName])
    .filter(network => network.Links)
    .map(network => network.Links))
    .map(link => link.split(':'))
    .map(parts => (
      <span key={parts[1]} className={style.item}>
        {parts[0]} | {parts[1]}
      </span>
    ));

  return (
    <span className={style.container}>
      <h3 key="networkHeader">Network</h3>
      <span className={style.labels}>
        {
          container.NetworkSettings.Networks && Object.keys(container.NetworkSettings.Networks)
            .map(network => (
              <span key={network} className={style.item}>
                {network} | {container.NetworkSettings.Networks[network].IPAddress}
              </span>
            ))
        }
        {
          container.NetworkSettings.Ports && Object.keys(container.NetworkSettings.Ports)
            .filter(port => container.NetworkSettings.Ports[port])
            .map(port => (
              <span key={port} className={style.item}>
                {port} | {container.NetworkSettings.Ports[port].map(p => p.HostPort).join(', ')}
              </span>
            ))
        }
      </span>
      {
        linkContent.length > 0 && [
          <h3 key="linksHeader">Links</h3>,
          <span key="labels" className={style.labels}>
            {linkContent}
          </span>,
        ]
      }
    </span>
  );
};

ContainerNetwork.displayName = 'ContainerNetwork';

ContainerNetwork.propTypes = {
  container: React.PropTypes.shape({
    NetworkSettings: React.PropTypes.shape({
      Ports: React.PropTypes.shape({}),
      Networks: React.PropTypes.shape({}),
    }).isRequired,
  }).isRequired,
};

export default ContainerNetwork;
