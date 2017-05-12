import React from 'react';
import PropTypes from 'prop-types';
import Graph from './Graph';
import style from './ContainerStats.less';

const CPU_COLOR = '#337ab7';
const MEMORY_COLOR = '#5cb85c';

/**
 * Show container stats.
 * @param  {Array<Object>} stats Container stats
 * @return {ReactComponent} Section with stats informations
 */
const ContainerStats = ({ stats }) => {
  if (!stats || !Array.isArray(stats.entries) || stats.entries.length === 0) {
    return null;
  }

  const { entries, memoryScaleNames, memoryLimit, cpuLimit } = stats;

  const data = {
    labels: entries.map(stat => stat.ts),
    datasets: [
      {
        label: 'CPU %',
        data: entries.map(stat => stat.cpu),
        backgroundColor: CPU_COLOR,
        borderColor: CPU_COLOR,
        fill: false,
        yAxisID: 'cpu',
      },
      {
        label: `Memory usage (${memoryScaleNames})`,
        data: entries.map(stat => stat.memory),
        backgroundColor: MEMORY_COLOR,
        borderColor: MEMORY_COLOR,
        fill: false,
        yAxisID: 'memory',
      },
    ],
  };

  const options = {
    animation: {
      duration: 0,
    },
    scales: {
      xAxes: [{
        ticks: {
          min: 0,
          max: 30,
        }
      }],
      yAxes: [
        {
          id: 'cpu',
          ticks: {
            beginAtZero: true,
            max: cpuLimit,
            fontColor: CPU_COLOR,
          },
        },
        {
          id: 'memory',
          position: 'right',
          ticks: {
            beginAtZero: true,
            max: memoryLimit,
            fontColor: MEMORY_COLOR,
          },
        },
      ],
    },
  };

  return (
    <span className={style.container}>
      <h3>Monitoring</h3>
      <div>
        <Graph type="line" data={data} options={options} />
      </div>
    </span>
  );
};

ContainerStats.displayName = 'ContainerStats';

ContainerStats.propTypes = {
  stats: PropTypes.shape({}),
};

ContainerStats.defaultProps = {
  stats: null,
};

export default ContainerStats;
