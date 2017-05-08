import React from 'react';
import PropTypes from 'prop-types';
import { humanFileSize } from './ContainerInfo';
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

  const memory = stats[stats.length - 1].memory_stats;

  return (
    <span className={style.container}>
      <h3>Monitoring</h3>
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
