import { FETCH_CONTAINER_SUCCEEDED } from '../actions';

const container = (state = null, action) => {
  if (action.type === FETCH_CONTAINER_SUCCEEDED) {
    return action.container;
  }
  return state;
};

export default container;
