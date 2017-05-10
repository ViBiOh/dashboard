import actions from '../actions';
import { humanSizeScale, humanSize, computeCpuPercentage } from '../../Tools/statHelper';

const MAX_STATS = 30;

const initialState = null;

/**
 * Logs's reducer.
 * @param  {Object} state  Existing logs's state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = initialState, action) => {
  if (action.type === actions.OPEN_STATS) {
    return [];
  }
  if (action.type === actions.ADD_STAT) {
    const scale = humanSizeScale(action.stat.memory_stats.limit)
    const stats = [
      ...state,
      {
        ts: new Date(Date.parse(action.stat.read)),
        cpu: computeCpuPercentage(action.stat),
        memory: humanSize(action.stat.memory_stats.usage, 2, scale),
        memoryLimit: humanSize(action.stat.memory_stats.limit, 0, scale),
      },
    ];
    if (stats.length > MAX_STATS) {
      stats.shift();
    }
    return stats;
  }
  if (action.type === actions.CLOSE_STATS) {
    return initialState;
  }
  return state;
};
