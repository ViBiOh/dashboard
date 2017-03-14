import actions from '../actions';

/**
 * Error's reducer.
 * @param  {Object} state  Existing error's state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = '', action) => {
  if (action.type === actions.SET_ERROR || /FAILED/.test(action.type)) {
    return action.error;
  }
  if (/SUCCEEDED/.test(action.type)) {
    return '';
  }
  return state;
};
