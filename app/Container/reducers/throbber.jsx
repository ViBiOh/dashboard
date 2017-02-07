import { FETCH_CONTAINERS, FETCH_CONTAINERS_SUCCEED, SET_ERROR } from '../actions';

const throbber = (state = false, action) => {
  if (action.type === FETCH_CONTAINERS || action.type === SET_ERROR) {
    return true;
  }
  if (action.type === FETCH_CONTAINERS_SUCCEED) {
    return false;
  }
  return state;
};

export default throbber;
