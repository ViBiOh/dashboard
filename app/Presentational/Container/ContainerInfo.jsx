import React from 'react';
import moment from 'moment';
import style from './ContainerInfo.css';

const BYTES_SIZE = 1024;
const BYTES_NAMES = ['Bytes', 'kB', 'MB', 'GB', 'TB'];
const ENV_PARSER = /(.*?)=(.*)/;

function humanFileSize(size) {
  const i = Math.floor(Math.log(size) / Math.log(BYTES_SIZE));
  // eslint-disable-next-line no-restricted-properties
  return `${(size / Math.pow(BYTES_SIZE, i)).toFixed(2)} ${BYTES_NAMES[i]}`;
}

const ContainerInfo = ({ container }) => {
  let labelContent = null;
  if (Object.keys(container.Config.Labels).length > 0) {
    labelContent = [
      <h3 key="labelsHeader">Labels</h3>,
      <span key="labels" className={style.labels}>
        {
          Object.keys(container.Config.Labels).map(label => (
            <span key={label} className={style.item}>
              {label} | {container.Config.Labels[label]}
            </span>
          ))
        }
      </span>,
    ];
  }

  let envContent = null;
  if (container.Config.Env.length > 0) {
    envContent = [
      <h3 key="envsHeader">Environment</h3>,
      <span key="envs" className={style.labels}>
        {
          container.Config.Env
            .filter(e => !!e)
            .map(env => ENV_PARSER.exec(env))
            .map(parts => (
              <span key={parts[1]} className={style.item}>
                {parts[1]} | {parts[2]}
              </span>
            ))
        }
      </span>,
    ];
  }

  return (
    <span className={style.container}>
      <h2>
        <span key="status" className={container.State.Running ? style.green : style.red}>
          {container.Name.replace(/^\//, '')}
        </span>
      </h2>
      <h3 key="config">Config</h3>
      <span key="id" className={style.info}>
        <span className={style.label}>Id</span>
        <span>{container.Id.substring(0, 12)}</span>
      </span>
      <span key="created" className={style.info}>
        <span className={style.label}>Created</span>
        <span>{moment(container.Created).fromNow()}</span>
      </span>
      <span key="image" className={style.info}>
        <span className={style.label}>Image</span>
        <span>{container.Config.Image}</span>
      </span>
      <span key="command" className={style.info}>
        <span className={style.label}>Command</span>
        <span>{`${container.Path} ${container.Args.join(' ')}`}</span>
      </span>
      <h3 key="hostConfig">HostConfig</h3>
      <span key="hostLabels" className={style.labels}>
        {
          container.HostConfig.RestartPolicy && <span key="restart" className={style.item}>
            Restart | {container.HostConfig.RestartPolicy.Name}:
            {container.HostConfig.RestartPolicy.MaximumRetryCount}
          </span>
        }
        {
          container.HostConfig.ReadonlyRootfs && <span key="read-only" className={style.item}>
            read-only
          </span>
        }
        {
          container.HostConfig.CpuShares && <span key="cpu" className={style.item}>
            CPU Shares | {container.HostConfig.CpuShares}
          </span>
        }
        {
          container.HostConfig.Memory > 0 && <span key="memory" className={style.item}>
            Memory limit| {humanFileSize(container.HostConfig.Memory)}
          </span>
        }
        {
          container.HostConfig.SecurityOpt && container.HostConfig.SecurityOpt.length > 0 && (
            <span key="security" className={style.item}>
              Security | {container.HostConfig.SecurityOpt.join(', ')}
            </span>
          )
        }
      </span>
      {labelContent}
      {envContent}
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
