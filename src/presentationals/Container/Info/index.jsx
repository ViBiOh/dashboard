import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FaThumbsDown, FaThumbsUp, FaEllipsisH } from 'react-icons/fa';
import { humanSize } from 'utils/statHelper';
import style from './index.css';

/**
 * Regex for parsing environment variables.
 * @type {RegExp}
 */
const ENV_PARSER = /(.*?)=(.*)/;

/**
 * Health Status Map
 * @type {Map<String, React.Component>}
 */
const healthIndicators = {
  starting: <FaEllipsisH />,
  healthy: <FaThumbsUp />,
  unhealthy: <FaThumbsDown />,
  none: '',
};

/**
 * Container's basic informations.
 * @param {Object} props Props of the component.
 * @return {React.Component} Container's basic informations.
 */
const Info = ({ container }) => {
  let labelContent = null;
  if (Object.keys(container.Config.Labels).length > 0) {
    labelContent = (
      <>
        <h3>Labels</h3>
        <span className={style.labels}>
          {Object.keys(container.Config.Labels).map(label => (
            <span key={label} className={style.item}>
              {label}
              {' | '}
              {container.Config.Labels[label]}
            </span>
          ))}
        </span>
      </>
    );
  }

  let envContent = null;
  if (container.Config.Env.length > 0) {
    envContent = (
      <>
        <h3>Environment</h3>
        <span className={style.labels}>
          {container.Config.Env.filter(e => !!e)
            .map(env => ENV_PARSER.exec(env))
            .filter(parts => parts !== null && parts.length > 2)
            .map(parts => (
              <span key={parts[1]} className={style.item}>
                {parts[1]}
                {' | '}
                {parts[2]}
              </span>
            ))}
        </span>
      </>
    );
  }

  let healthContent = null;
  if (container.State.Health) {
    healthContent = healthIndicators[container.State.Health.Status];
  }

  return (
    <span className={style.container}>
      <h2 className={style.title}>
        <span
          className={`${style.pastille} ${container.State.Running ? style.green : style.red}`}
          data-container-name
        >
          {String(container.Name).replace(/^\//, '')}
        </span>
        {healthContent && (
          <span className={style.icon} title={container.State.Health.Status}>
            {healthContent}
          </span>
        )}
      </h2>
      <h3>Config</h3>
      <span className={style.info}>
        <span className={style.label}>Id</span>
        <span>{String(container.Id).substring(0, 12)}</span>
      </span>
      <span className={style.info}>
        <span className={style.label}>Created</span>
        <span>{moment(container.Created).fromNow()}</span>
      </span>
      <span className={style.info}>
        <span className={style.label}>Image</span>
        <span>{container.Config.Image}</span>
      </span>
      <span className={style.info}>
        <span className={style.label}>Command</span>
        <pre className={style.code}>{`${container.Path} ${container.Args.join(' ')}`}</pre>
      </span>
      <h3>HostConfig</h3>
      <span className={style.labels}>
        {container.HostConfig.RestartPolicy && (
          <span className={style.item}>
            Restart
            {' | '}
            {container.HostConfig.RestartPolicy.Name}
            {container.HostConfig.RestartPolicy.MaximumRetryCount
              ? `:${container.HostConfig.RestartPolicy.MaximumRetryCount}`
              : ''}
          </span>
        )}
        {container.HostConfig.ReadonlyRootfs && <span className={style.item}>read-only</span>}
        {container.HostConfig.CpuShares > 0 && (
          <span className={style.item}>
            CPU Shares
            {' | '}
            {container.HostConfig.CpuShares}
          </span>
        )}
        {container.HostConfig.Memory > 0 && (
          <span className={style.item}>
            Memory limit
            {' | '}
            {humanSize(container.HostConfig.Memory)}
          </span>
        )}
        {container.HostConfig.SecurityOpt &&
          container.HostConfig.SecurityOpt.length > 0 && (
            <span className={style.item}>
              Security
              {' | '}
              {container.HostConfig.SecurityOpt.join(', ')}
            </span>
          )}
      </span>
      {labelContent}
      {envContent}
    </span>
  );
};

Info.displayName = 'Info';

Info.propTypes = {
  container: PropTypes.shape({
    Id: PropTypes.string,
    Name: PropTypes.string,
    Args: PropTypes.arrayOf(PropTypes.string).isRequired,
    Created: PropTypes.string,
    State: PropTypes.shape({
      Running: PropTypes.bool,
    }).isRequired,
    Config: PropTypes.shape({
      Image: PropTypes.string,
      Labels: PropTypes.shape({}).isRequired,
      Env: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    HostConfig: PropTypes.shape({
      ReadonlyRootfs: PropTypes.bool,
      RestartPolicy: PropTypes.shape({
        Name: PropTypes.string,
        MaximumRetryCount: PropTypes.number,
      }),
      CpuShares: PropTypes.number,
      Memory: PropTypes.number,
      SecurityOpt: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
  }).isRequired,
};

export default Info;
