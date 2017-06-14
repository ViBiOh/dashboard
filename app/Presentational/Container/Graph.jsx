import React, { Component } from 'react';
import Chart from 'chart.js';
import setRef from '../../Tools/ref';
import style from './Graph.less';

/**
 * Rendering Chart.js Graph.
 */
export default class Graph extends Component {
  /**
   * Update chart at first mount.
   */
  componentDidMount() {
    this.updateChart(this.props);
  }

  /**
   * Update chart at props update.
   */
  componentWillReceiveProps(newProps) {
    this.updateChart(newProps);
  }

  /**
   * Destroying chart on unmount.
   */
  componentWillUnmount() {
    this.clearChart();
  }

  /**
   * Update or creation of charts.
   * @param  {Object} config Chart's configuration
   * @return {Object} Chart.js instance
   */
  updateChart(config) {
    const { type, data, options } = config;

    if (this.chart) {
      this.chart.data.datasets = data.datasets;
      this.chart.data.labels = data.labels;
      this.chart.update();
    } else if (this.graph) {
      /**
       * Chart component ref.
       */
      this.chart = new Chart(this.graph, {
        type,
        data,
        options,
      });
    }

    return this.chart;
  }

  /**
   * Destroy chart.js instance
   */
  clearChart() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  /**
   * Render chart.js
   * @return {ReactComponent} chart.js in a canvas
   */
  render() {
    return <canvas ref={e => setRef(this, 'graph', e)} className={style.canvas} />;
  }
}
