import actions from '../actions';

const initialState = null;
export default (state = initialState, action) => {
  if (action.type === actions.FETCH_CONTAINERS_SUCCEEDED) {
    return action.containers;
  }
  return state;
};
