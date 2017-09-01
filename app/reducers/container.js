import actions from '../actions';

/**
 * Container's reducer.
 * @param  {Object} state  Existing container's state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = null, action) => {
  switch (action.type) {
    case actions.FETCH_CONTAINER_SUCCEEDED:
      return action.container;
    case actions.FETCH_CONTAINER_FAILED:
      return null;
    default:
      return state;
  }
};
