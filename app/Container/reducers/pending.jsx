import { LOGIN } from '../actions';

const endPending = /^(.*?)_(?:SUCCEEDED|FAILED)$/;

const pending = (state = {}, action) => {
  if (action.type === LOGIN) {
    return { ...state, [LOGIN]: true };
  }

  const result = endPending.exec(action.type);
  if (result) {
    return { ...state, [result[1]]: false };
  }
  return state;
};

export default pending;
