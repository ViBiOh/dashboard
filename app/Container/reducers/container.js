import actions from '../actions';

export default (state = null, action) => {
  if (action.type === actions.FETCH_CONTAINER_SUCCEEDED) {
    return action.container;
  }
  return state;
};
