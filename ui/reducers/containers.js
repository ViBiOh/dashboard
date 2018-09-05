import actions from '../actions';

/**
 * Containers' reducer.
 * @param  {Object} state  Existing containers' state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default function(state = null, action) {
  switch (action.type) {
    case actions.FETCH_CONTAINERS_SUCCEEDED:
      return action.containers;
    case actions.LOGIN_REQUEST:
    case actions.LOGOUT_REQUEST:
      return null;
    default:
      return state;
  }
}
