import actions from '../actions';

/**
 * Container's reducer.
 * @param  {Object} state  Existing container's state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = null, action) => {
  if (action.type === actions.FETCH_CONTAINER_SUCCEEDED) {
    return action.container;
  }
  return state;
};
