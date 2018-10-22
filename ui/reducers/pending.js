/**
 * Start pending regex.
 * @type {RegExp}
 */
const startPending = /^(.*?)_REQUEST$/;

/**
 * End pending regex.
 * @type {RegExp}
 */
const endPending = /^(.*?)_(?:SUCCEEDED|FAILED)$/;

/**
 * Pendings' reducer initial state.
 * @type {Object}
 */
export const initialState = {};

/**
 * Pendings' reducer.
 * @param  {Object} state  Existing pendings' state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default function(state = initialState, action) {
  const start = startPending.exec(action.type);
  if (start && start.length > 1) {
    return { ...state, [start[1]]: true };
  }

  const end = endPending.exec(action.type);
  if (end && state[end[1]]) {
    return { ...state, [end[1]]: false };
  }

  return state;
}
