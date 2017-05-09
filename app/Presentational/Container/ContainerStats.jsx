import React from 'react';
import PropTypes from 'prop-types';
import { humanFileSize } from './ContainerInfo';
import style from './ContainerStats.less';

/**
 * Compute CPU percentage of containers.
 * @param  {Object} stat Container's stat
 * @return {Number}      CPU percentage
 */
function computeCpuPercentage(stat) {
  const cpuDelta = stat.cpu_stats.cpu_usage.total_usage - stat.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stat.cpu_stats.system_cpu_usage - stat.precpu_stats.system_cpu_usage;
  const ratio = cpuDelta / systemDelta;
  const cpuCoeff = 100 * stat.cpu_stats.cpu_usage.percpu_usage.length;

  return (ratio * cpuCoeff).toFixed(2);
}

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
  const memory = stat.memory_stats;

  return (
    <span className={style.container}>
      <h3>Monitoring</h3>
      <span key="cpu">
        <span className={style.label}>CPU</span>
        <span>{computeCpuPercentage(stat)}%</span>
      </span>
      <span key="memory">
        <span className={style.label}>Memory</span>
        <span>{humanFileSize(memory.usage, 2)} / {humanFileSize(memory.limit)}</span>
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
