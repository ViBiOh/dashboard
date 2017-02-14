import { OPEN_LOGS, ADD_LOG, CLOSE_LOGS } from '../actions';

export default (state = null, action) => {
  if (action.type === OPEN_LOGS) {
    return [];
  }
  if (action.type === ADD_LOG) {
    return [...state, action.log];
  }
  if (action.type === CLOSE_LOGS) {
    return null;
  }
  return state;
};
