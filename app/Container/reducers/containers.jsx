import { FETCH_CONTAINERS_SUCCEED } from '../actions';

const containers = (state = [], action) => {
  if (action.type === FETCH_CONTAINERS_SUCCEED) {
    return action.containers;
  }
  return state;
};

export default containers;
