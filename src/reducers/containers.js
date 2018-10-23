import actions from 'actions';

/**
 * Containers' reducer initial state.
 * @type {Object}
 */
export const initialState = null;

/**
 * Containers' reducer.
 * @param  {Object} state  Existing containers' state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default function(state = initialState, action) {
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
