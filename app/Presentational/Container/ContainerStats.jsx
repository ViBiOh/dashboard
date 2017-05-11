import React from 'react';
import PropTypes from 'prop-types';
import Graph from './Graph';
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

  const data = {
    labels: stats.map(stat => stat.ts),
    datasets: [
      {
        label: 'CPU %',
        data: stats.map(stat => stat.cpu),
        backgroundColor: '#5bc0de',
        borderColor: '#5bc0de',
        fill: false,
        yAxisID: 'cpu',
      },
      {
        label: `Memory usage (${stats[stats.length - 1].memoryScale})`,
        data: stats.map(stat => parseFloat(stat.memory, 10)),
        backgroundColor: '#d9534f',
        borderColor: '#d9534f',
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
        },
        {
          id: 'memory',
          position: 'right',
          ticks: {
            beginAtZero: true,
            max: parseFloat(stats[stats.length - 1].memoryLimit, 10),
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
