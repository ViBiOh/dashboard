import actions from '../actions';

const initialState = [];

/**
 * Logs's reducer.
 * @param  {Object} state  Existing logs's state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = initialState, action) => {
  if (action.type === actions.OPEN_LOGS) {
    return initialState;
  }
  if (action.type === actions.ADD_LOG) {
    return [...state, action.log];
  }
  if (action.type === actions.CLOSE_LOGS) {
    return initialState;
  }
  return state;
};
