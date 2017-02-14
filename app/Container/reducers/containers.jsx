import { FETCH_CONTAINERS_SUCCEEDED } from '../actions';

export default (state = null, action) => {
  if (action.type === FETCH_CONTAINERS_SUCCEEDED) {
    return action.containers;
  }
  return state;
};
