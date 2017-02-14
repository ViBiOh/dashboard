import { FETCH_CONTAINER_SUCCEEDED } from '../actions';

export default (state = null, action) => {
  if (action.type === FETCH_CONTAINER_SUCCEEDED) {
    return action.container;
  }
  return state;
};
