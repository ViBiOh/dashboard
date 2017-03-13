import actions from '../actions';

export default (state = null, action) => {
  if (action.type === actions.FETCH_CONTAINERS_SUCCEEDED) {
    return action.containers;
  }
  return state;
};
