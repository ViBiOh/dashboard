import actions from '../actions';
import {
  BYTES_NAMES,
  humanSizeScale,
  scaleSize,
  cpuPercentageMax,
  computeCpuPercentage,
} from '../../Tools/statHelper';

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
    return {
      entries: [],
    };
  }
  if (action.type === actions.ADD_STAT) {
    const nextState = { ...state };

    if (!nextState.memoryScale && action.stat.memory_stats.limit) {
      nextState.memoryScale = humanSizeScale(action.stat.memory_stats.limit);
      nextState.memoryScaleNames = BYTES_NAMES[nextState.memoryScale];
      nextState.memoryLimit = scaleSize(action.stat.memory_stats.limit, nextState.memoryScale);
    }

    if (!nextState.cpuLimit) {
      nextState.cpuLimit = cpuPercentageMax(action.stat);
    }

    nextState.entries = [
      ...state.entries,
      {
        ts: new Date(Date.parse(action.stat.read)),
        cpu: computeCpuPercentage(action.stat),
        memory: scaleSize(action.stat.memory_stats.usage, nextState.memoryScale),
      },
    ];

    if (nextState.entries.length > MAX_STATS) {
      nextState.entries.shift();
    }

    return nextState;
  }
  if (action.type === actions.CLOSE_STATS) {
    return {
      entries: [],
    };
  }
  return state;
};
