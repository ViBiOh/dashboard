import actions from 'actions';
import { STATS_COUNT } from 'Constants';
import {
  BYTES_NAMES,
  humanSizeScale,
  scaleSize,
  cpuPercentageMax,
  computeCpuPercentage,
} from 'utils/statHelper';

/**
 * Stats' reducer initial state.
 * @type {Object}
 */
export const initialState = {
  entries: [],
};

/**
 * Stats' reducer.
 * @param  {Object} state  Existing stats' state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default function(state = initialState, action) {
  let nextState;

  switch (action.type) {
    case actions.OPEN_STATS:
      return initialState;

    case actions.ADD_STAT:
      nextState = { ...state };

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

      if (nextState.entries.length > STATS_COUNT) {
        nextState.entries.shift();
      }

      return nextState;

    case actions.CLOSE_STATS:
      return initialState;

    default:
      return state;
  }
}
