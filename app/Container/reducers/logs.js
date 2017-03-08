import actions from '../actions';

export default (state = null, action) => {
  if (action.type === actions.OPEN_LOGS) {
    return [];
  }
  if (action.type === actions.ADD_LOG) {
    return [...state, action.log];
  }
  if (action.type === actions.CLOSE_LOGS) {
    return null;
  }
  return state;
};
