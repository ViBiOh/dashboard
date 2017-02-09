import { LOGIN } from '../actions';

const endPending = /(?:SUCCEEDEDED|FAILED)$/;
const endTypePending = /^(.*?)_(?:SUCCEEDEDED|FAILED)$/;

const pending = (state = {}, action) => {
  if (action.type === LOGIN) {
    return { ...state, [LOGIN]: true };
  }

  if (endPending.test(action.type)) {
    return { ...state, [endTypePending.exec(action.type)[1]]: false };
  }
  return state;
};

export default pending;
