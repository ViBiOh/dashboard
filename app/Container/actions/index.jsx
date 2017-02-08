export const FETCH_CONTAINERS = 'FETCH_CONTAINERS';
export const fetchContainers = () => ({
  type: FETCH_CONTAINERS,
});

export const FETCH_CONTAINERS_SUCCEED = 'FETCH_CONTAINERS_SUCCEED';
export const fetchContainersSucceed = containers => ({
  type: FETCH_CONTAINERS_SUCCEED,
  containers,
});

export const FETCH_CONTAINER = 'FETCH_CONTAINER';
export const fetchContainer = id => ({
  type: FETCH_CONTAINER,
  id,
});

export const FETCH_CONTAINER_SUCCEED = 'FETCH_CONTAINER_SUCCEED';
export const fetchContainerSucceed = containers => ({
  type: FETCH_CONTAINER_SUCCEED,
  containers,
});

export const SET_ERROR = 'SET_ERROR';
export const setError = err => ({
  type: SET_ERROR,
  error: err,
});
