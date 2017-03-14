import actions from '../actions';

const pendingActions = [
  actions.LOGIN,
  actions.FETCH_CONTAINERS,
  actions.FETCH_CONTAINER,
  actions.ACTION_CONTAINER,
  actions.COMPOSE,
];
const endPending = /^(.*?)_(?:SUCCEEDED|FAILED)$/;

/**
 * Pendings' reducer.
 * @param  {Object} state  Existing pendings' state
 * @param  {Object} action Action dispatched
 * @return {Object}        New state
 */
export default (state = {}, action) => {
  if (pendingActions.includes(action.type)) {
    return { ...state, [action.type]: true };
  }

  const result = endPending.exec(action.type);
  if (result && state[result[1]]) {
    return { ...state, [result[1]]: false };
  }
  return state;
};
