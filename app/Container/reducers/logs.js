import actions from '../actions';

const initialState = null;
export default (state = initialState, action) => {
  if (action.type === actions.OPEN_LOGS) {
    return [];
  }
  if (action.type === actions.ADD_LOG) {
    return [...state, action.log];
  }
  if (action.type === actions.CLOSE_LOGS) {
    return initialState;
  }
  return state;
};
