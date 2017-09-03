import actions from '../actions';

/**
 * Start error regex.
 * @type {RegExp}
 */
const startError = /_FAILED$/;

/**
 * End error regex.
 * @type {RegExp}
 */
const endError = /_SUCCEEDED$/;

/**
 * Error's reducer.
 * @param  {Object} state  Existing error's state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = '', action) => {
  if (action.type === actions.SET_ERROR || startError.test(action.type)) {
    return action.error;
  }
  if (endError.test(action.type)) {
    return '';
  }

  return state;
};
