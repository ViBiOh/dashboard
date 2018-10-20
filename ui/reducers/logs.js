import actions from '../actions';

/**
 * Initial state for logs.
 * @type {Array}
 */
const initialState = {
  fullscreen: false,
  logs: [],
};

/**
 * Logs's reducer.
 * @param  {Object} state  Existing logs's state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default function(state = initialState, action) {
  switch (action.type) {
    case actions.OPEN_LOGS:
      return initialState;
    case actions.ADD_LOG:
      return {
        ...state,
        logs: [...state.logs, action.log],
      };
    case actions.CLOSE_LOGS:
      return initialState;
    case actions.TOGGLE_FULLSCREEN_LOGS:
      return {
        ...state,
        fullscreen: !state.fullscreen,
      };
    default:
      return state;
  }
}
