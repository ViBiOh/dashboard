import { OPEN_LOGS, ADD_LOG, CLOSE_LOGS } from '../actions';

const logs = (state = null, action) => {
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

export default logs;
