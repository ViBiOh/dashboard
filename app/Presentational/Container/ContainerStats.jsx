import React from 'react';
import PropTypes from 'prop-types';
import style from './ContainerStats.less';

/**
 * Show container stats.
 * @param  {Array<Object>} stats Container stats
 * @return {ReactComponent} Section with stats informations
 */
const ContainerStats = ({ stats }) => {
  if (!Array.isArray(stats) || stats.length === 0) {
    return null;
  }

  const stat = stats[stats.length - 1];

  return (
    <span className={style.container}>
      <h3>Monitoring</h3>
      <span key="cpu">
        <span className={style.label}>CPU</span>
        <span>{stat.cpu}%</span>
      </span>
      <span key="memory">
        <span className={style.label}>Memory</span>
        <span>{stat.memory} / {stat.memoryLimit}</span>
      </span>
    </span>
  );
};

ContainerStats.displayName = 'ContainerStats';

ContainerStats.propTypes = {
  stats: PropTypes.arrayOf(PropTypes.shape({})),
};

ContainerStats.defaultProps = {
  stats: null,
};

export default ContainerStats;
