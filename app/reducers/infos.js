import actions from '../actions';

/**
 * Info's reducer.
 * @param  {Object} state  Existing info's state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = {}, action) => {
  if (action.type === actions.INFO_SUCCEEDED) {
    return action.infos;
  }
  return state;
};
