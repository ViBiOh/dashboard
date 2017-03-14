import actions from '../actions';

/**
 * Containers' reducer.
 * @param  {Object} state  Existing containers' state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = null, action) => {
  if (action.type === actions.FETCH_CONTAINERS_SUCCEEDED) {
    return action.containers;
  }
  return state;
};
