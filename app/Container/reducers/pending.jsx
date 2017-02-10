import { LOGIN, FETCH_CONTAINERS, FETCH_CONTAINER } from '../actions';

const endPending = /^(.*?)_(?:SUCCEEDED|FAILED)$/;

const pending = (state = {}, action) => {
  if (action.type === LOGIN || action.type === FETCH_CONTAINERS || action.type === FETCH_CONTAINER) {
    return { ...state, [action.type]: true };
  }

  const result = endPending.exec(action.type);
  if (result && state[result[1]]) {
    return { ...state, [result[1]]: false };
  }
  return state;
};

export default pending;
