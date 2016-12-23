import React from 'react';
import style from './Containers.css';

const ContainerNetwork = ({ container }) => (
  <span className={style.container}>
    <h2>Network</h2>
    {
      Object.keys(container.NetworkSettings.Networks)
        .map(network => (
          <span key={network} className={style.info}>
            <span className={style.label}>{network}</span>
            <span>{container.NetworkSettings.Networks[network].IPAddress}</span>
          </span>
        ))
    }
    {
      Object.keys(container.NetworkSettings.Ports)
        .filter(port => container.NetworkSettings.Ports[port])
        .map(port => (
          <span key={port} className={style.info}>
            <span className={style.label}>{port}</span>
            <span>mapped to&nbsp;
            {
              container.NetworkSettings.Ports[port].map(p => p.HostPort).join(', ')
            } on host</span>
          </span>
        ))
    }
  </span>
);

ContainerNetwork.displayName = 'ContainerNetwork';

ContainerNetwork.propTypes = {
  container: React.PropTypes.shape({
    NetworkSettings: React.PropTypes.shape({
      Ports: React.PropTypes.shape({}).isRequired,
      Networks: React.PropTypes.shape({}).isRequired,
    }).isRequired,
  }).isRequired,
};

export default ContainerNetwork;
