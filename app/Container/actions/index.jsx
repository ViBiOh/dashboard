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
export const fetchContainerSucceed = container => ({
  type: FETCH_CONTAINER_SUCCEED,
  container,
});

export const ACTION_CONTAINER_SUCCEED = 'ACTION_CONTAINER_SUCCEED';
export const actionContainerSucceed = id => ({
  type: ACTION_CONTAINER_SUCCEED,
  id,
});

export const SET_ERROR = 'SET_ERROR';
export const setError = error => ({
  type: SET_ERROR,
  error,
});

export const LOGIN = 'LOGIN';
export const login = (username, password) => ({
  type: LOGIN,
  username,
  password,
});

export const LOGIN_SUCCEED = 'LOGIN_SUCCEED';
export const loginSucceed = () => ({
  type: LOGIN_SUCCEED,
});

export const LOGIN_FAILED = 'LOGIN_FAILED';
export const loginFailed = error => ({
  type: LOGIN_FAILED,
  error,
});
