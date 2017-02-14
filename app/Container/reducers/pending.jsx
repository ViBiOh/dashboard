import { LOGIN, FETCH_CONTAINERS, FETCH_CONTAINER, ACTION_CONTAINER, COMPOSE } from '../actions';

const pendingActions = [LOGIN, FETCH_CONTAINERS, FETCH_CONTAINER, ACTION_CONTAINER, COMPOSE];
const endPending = /^(.*?)_(?:SUCCEEDED|FAILED)$/;

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
