import actions from '../actions';

const initialState = '';
export default (state = initialState, action) => {
  if (action.type === actions.SET_ERROR || /FAILED/.test(action.type)) {
    return action.error;
  }
  if (/SUCCEEDED/.test(action.type)) {
    return '';
  }
  return state;
};
