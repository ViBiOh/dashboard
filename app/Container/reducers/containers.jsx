import { FETCH_CONTAINERS_SUCCEEDED } from '../actions';

const containers = (state = null, action) => {
  if (action.type === FETCH_CONTAINERS_SUCCEEDED) {
    return action.containers;
  }
  return state;
};

export default containers;
