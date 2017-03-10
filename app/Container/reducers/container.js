import actions from '../actions';

const initialState = null;
export default (state = initialState, action) => {
  if (action.type === actions.FETCH_CONTAINER_SUCCEEDED) {
    return action.container;
  }
  return state;
};
