import { LOGIN, LOGIN_SUCCEED, LOGIN_FAILED } from '../actions';

const loginPending = (state = false, action) => {
  if (action.type === LOGIN) {
    return true;
  }

  if (action.type === LOGIN_SUCCEED || action.type === LOGIN_FAILED) {
    return false;
  }
  return state;
};

export default loginPending;
