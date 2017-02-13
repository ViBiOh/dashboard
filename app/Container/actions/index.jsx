export const LOGIN = 'LOGIN';
export const login = (username, password) => ({
  type: LOGIN,
  username,
  password,
});

export const LOGIN_SUCCEEDED = 'LOGIN_SUCCEEDED';
export const loginSucceeded = () => ({
  type: LOGIN_SUCCEEDED,
});

export const LOGIN_FAILED = 'LOGIN_FAILED';
export const loginFailed = error => ({
  type: LOGIN_FAILED,
  error,
});

export const LOGOUT = 'LOGOUT';
export const logout = () => ({
  type: LOGOUT,
});

export const LOGOUT_SUCCEEDED = 'LOGOUT_SUCCEEDED';
export const logoutSucceeded = () => ({
  type: LOGOUT_SUCCEEDED,
});

export const LOGOUT_FAILED = 'LOGOUT_FAILED';
export const logoutFailed = error => ({
  type: LOGOUT_FAILED,
  error,
});

export const FETCH_CONTAINERS = 'FETCH_CONTAINERS';
export const fetchContainers = () => ({
  type: FETCH_CONTAINERS,
});

export const FETCH_CONTAINERS_SUCCEEDED = 'FETCH_CONTAINERS_SUCCEEDED';
export const fetchContainersSucceeded = containers => ({
  type: FETCH_CONTAINERS_SUCCEEDED,
  containers,
});

export const FETCH_CONTAINERS_FAILED = 'FETCH_CONTAINERS_FAILED';
export const fetchContainersFailed = error => ({
  type: FETCH_CONTAINERS_FAILED,
  error,
});

export const FETCH_CONTAINER = 'FETCH_CONTAINER';
export const fetchContainer = id => ({
  type: FETCH_CONTAINER,
  id,
});

export const FETCH_CONTAINER_SUCCEEDED = 'FETCH_CONTAINER_SUCCEEDED';
export const fetchContainerSucceeded = container => ({
  type: FETCH_CONTAINER_SUCCEEDED,
  container,
});

export const FETCH_CONTAINER_FAILED = 'FETCH_CONTAINER_FAILED';
export const fetchContainerFailed = error => ({
  type: FETCH_CONTAINER_FAILED,
  error,
});

export const ACTION_CONTAINER = 'ACTION_CONTAINER';
export const actionContainer = (action, id) => ({
  type: ACTION_CONTAINER,
  action,
  id,
});

export const ACTION_CONTAINER_SUCCEEDED = 'ACTION_CONTAINER_SUCCEEDED';
export const actionContainerSucceeded = () => ({
  type: ACTION_CONTAINER_SUCCEEDED,
});

export const ACTION_CONTAINER_FAILED = 'ACTION_CONTAINER_FAILED';
export const actionContainerFailed = error => ({
  type: ACTION_CONTAINER_FAILED,
  error,
});

export const COMPOSE = 'COMPOSE';
export const compose = (name, file) => ({
  type: COMPOSE,
  name,
  file,
});

export const COMPOSE_SUCCEEDED = 'COMPOSE_SUCCEEDED';
export const composeSucceeded = () => ({
  type: COMPOSE_SUCCEEDED,
});

export const COMPOSE_FAILED = 'COMPOSE_FAILED';
export const composeFailed = error => ({
  type: COMPOSE_FAILED,
  error,
});

export const OPEN_LOGS = 'OPEN_LOGS';
export const openLogs = id => ({
  type: OPEN_LOGS,
  id,
});

export const CLOSE_LOGS = 'CLOSE_LOGS';
export const closeLogs = () => ({
  type: CLOSE_LOGS,
});

export const ADD_LOG = 'ADD_LOG';
export const addLog = log => ({
  type: ADD_LOG,
  log,
});