import { SET_ERROR } from '../actions';

const error = (state = '', action) => {
  if (action.type === SET_ERROR) {
    return action.error;
  }
  return state;
};

export default error;
