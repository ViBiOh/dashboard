import { FETCH_CONTAINER_SUCCEEDED } from '../actions';

const container = (state = {}, action) => {
  if (action.type === FETCH_CONTAINER_SUCCEEDED) {
    return action.container;
  }
  return state;
};

export default container;
