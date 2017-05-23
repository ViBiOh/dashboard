import actions from '../actions';

/**
 * Containers' reducer.
 * @param  {Object} state  Existing containers' state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = null, action) => {
  switch (action.type) {
    case actions.FETCH_CONTAINERS_SUCCEEDED:
      return action.containers;
    case actions.LOGIN:
    case actions.LOGOUT:
      return null;
    default:
      return state;
  }
};
