import actions from 'actions';

/**
 * Filter's reducer initial state.
 * @type {String}
 */
export const initialState = '';

/**
 * Filter's reducer.
 * @param {String} state  Existing filter's state
 * @param {Object} action Action dispatched
 * @return {Object} New state
 */
export default function(state = initialState, action) {
  switch (action.type) {
    case actions.CHANGE_FILTER:
      return action.value;
    default:
      return state;
  }
}
