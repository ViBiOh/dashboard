import React from 'react';
import PropTypes from 'prop-types';
import Graph from './Graph';
import style from './ContainerStats.less';

const CPU_COLOR = '#5bc0de';
const MEMORY_COLOR = '#d9534f';

/**
 * Show container stats.
 * @param  {Array<Object>} stats Container stats
 * @return {ReactComponent} Section with stats informations
 */
const ContainerStats = ({ stats }) => {
  if (!Array.isArray(stats) || stats.length === 0) {
    return null;
  }

  const data = {
    labels: stats.map(stat => stat.ts),
    datasets: [
      {
        label: 'CPU %',
        data: stats.map(stat => stat.cpu),
        backgroundColor: CPU_COLOR,
        borderColor: CPU_COLOR,
        fill: false,
        yAxisID: 'cpu',
      },
      {
        label: `Memory usage (${stats[stats.length - 1].memoryScale})`,
        data: stats.map(stat => parseFloat(stat.memory, 10)),
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
      xAxes: [
        {
          display: false,
        },
        {
          display: false,
        },
      ],
      yAxes: [
        {
          id: 'cpu',
          ticks: {
            beginAtZero: true,
            max: stats[stats.length - 1].cpuLimit,
          },
          scaleLabel: {
            fontColor: CPU_COLOR,
          },
        },
        {
          id: 'memory',
          position: 'right',
          ticks: {
            beginAtZero: true,
            max: parseFloat(stats[stats.length - 1].memoryLimit, 10),
          },
          scaleLabel: {
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
  stats: PropTypes.arrayOf(PropTypes.shape({})),
};

ContainerStats.defaultProps = {
  stats: null,
};

export default ContainerStats;
