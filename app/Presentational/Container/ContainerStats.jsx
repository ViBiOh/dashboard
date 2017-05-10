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
    labels: [],
    datasets: [
      {
        label: 'CPU %',
        data: [],
        backgroundColor: '#5bc0de',
        borderColor: '#5bc0de',
        fill: false,
      },
      {
        label: 'Memory usage',
        data: [],
        backgroundColor: '#d9534f',
        borderColor: '#d9534f',
        fill: false,
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
          ticks: {
            beginAtZero: true,
            color: '#5bc0de',
          },
        },
        {
          position: 'right',
          ticks: {
            beginAtZero: true,
            max: parseFloat(stats[stats.length - 1].memoryLimit, 10),
            color: '#d9534f',
          },
        },
      ],
    },
  };

  stats.forEach(stat => {
    data.labels.push(stat.ts);
    data.datasets[0].data.push(stat.cpu);
    data.datasets[1].data.push(parseFloat(stat.memory, 10));
  });

  return (
    <span className={style.container}>
      <h3>Monitoring</h3>
      <div className={style.graph}>
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
