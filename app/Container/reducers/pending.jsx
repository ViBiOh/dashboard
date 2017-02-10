import { LOGIN, FETCH_CONTAINERS, FETCH_CONTAINER } from '../actions';

const pendingActions = [LOGIN, FETCH_CONTAINERS, FETCH_CONTAINER];
const endPending = /^(.*?)_(?:SUCCEEDED|FAILED)$/;

const pending = (state = {}, action) => {
  if (pendingActions.includes(action.type)) {
    return { ...state, [action.type]: true };
  }

  const result = endPending.exec(action.type);
  if (result && state[result[1]]) {
    return { ...state, [result[1]]: false };
  }
  return state;
};

export default pending;
