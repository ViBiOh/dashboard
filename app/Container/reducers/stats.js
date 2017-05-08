import actions from '../actions';

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
    const stats = [...state, action.stat];
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
