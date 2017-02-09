import { SET_ERROR } from '../actions';

const error = (state = '', action) => {
  if (action.type === SET_ERROR || /FAILED/.test(action.type)) {
    return action.error;
  }
  if (/SUCCEED/.test(action.type)) {
    return '';
  }
  return state;
};

export default error;
