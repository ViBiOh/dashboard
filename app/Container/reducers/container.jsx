import { FETCH_CONTAINER_SUCCEED } from '../actions';

const container = (state = [], action) => {
  if (action.type === FETCH_CONTAINER_SUCCEED) {
    return action.container;
  }
  return state;
};

export default container;
