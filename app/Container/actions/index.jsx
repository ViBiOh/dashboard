export const FETCH_CONTAINERS = 'FETCH_CONTAINERS';
export const fetchContainers = () => ({
  type: FETCH_CONTAINERS,
});

export const FETCH_CONTAINERS_SUCCEED = 'FETCH_CONTAINERS_SUCCEED';
export const containerListSucceed = containers => ({
  type: FETCH_CONTAINERS_SUCCEED,
  containers,
});

export const SET_ERROR = 'SET_ERROR';
export const error = err => ({
  type: SET_ERROR,
  error: err,
});
