function makeActionCreator(type, ...argNames) {
  return (...args) => {
    const action = { type };
    argNames.forEach((arg, index) => {
      action[argNames[index]] = args[index];
    });
    return action;
  };
}

export const LOGIN = 'LOGIN';
export const login = makeActionCreator(LOGIN, 'username', 'password');

export const LOGIN_SUCCEEDED = 'LOGIN_SUCCEEDED';
export const loginSucceeded = makeActionCreator(LOGIN_SUCCEEDED);

export const LOGIN_FAILED = 'LOGIN_FAILED';
export const loginFailed = makeActionCreator(LOGIN_FAILED, 'error');

export const LOGOUT = 'LOGOUT';
export const logout = makeActionCreator(LOGOUT, 'error');

export const LOGOUT_SUCCEEDED = 'LOGOUT_SUCCEEDED';
export const logoutSucceeded = makeActionCreator(LOGOUT_SUCCEEDED, 'error');

export const LOGOUT_FAILED = 'LOGOUT_FAILED';
export const logoutFailed = makeActionCreator(LOGOUT_FAILED, 'error');

export const FETCH_CONTAINERS = 'FETCH_CONTAINERS';
export const fetchContainers = makeActionCreator(FETCH_CONTAINERS);

export const FETCH_CONTAINERS_SUCCEEDED = 'FETCH_CONTAINERS_SUCCEEDED';
export const fetchContainersSucceeded = makeActionCreator(FETCH_CONTAINERS_SUCCEEDED, 'containers');

export const FETCH_CONTAINERS_FAILED = 'FETCH_CONTAINERS_FAILED';
export const fetchContainersFailed = makeActionCreator(FETCH_CONTAINERS_FAILED, 'error');

export const FETCH_CONTAINER = 'FETCH_CONTAINER';
export const fetchContainer = makeActionCreator(FETCH_CONTAINER, 'id');

export const FETCH_CONTAINER_SUCCEEDED = 'FETCH_CONTAINER_SUCCEEDED';
export const fetchContainerSucceeded = makeActionCreator(FETCH_CONTAINER_SUCCEEDED, 'container');

export const FETCH_CONTAINER_FAILED = 'FETCH_CONTAINER_FAILED';
export const fetchContainerFailed = makeActionCreator(FETCH_CONTAINER_FAILED, 'error');

export const ACTION_CONTAINER = 'ACTION_CONTAINER';
export const actionContainer = makeActionCreator(ACTION_CONTAINER, 'action', 'id');

export const ACTION_CONTAINER_SUCCEEDED = 'ACTION_CONTAINER_SUCCEEDED';
export const actionContainerSucceeded = makeActionCreator(ACTION_CONTAINER_SUCCEEDED);

export const ACTION_CONTAINER_FAILED = 'ACTION_CONTAINER_FAILED';
export const actionContainerFailed = makeActionCreator(ACTION_CONTAINER_FAILED, 'error');

export const COMPOSE = 'COMPOSE';
export const compose = makeActionCreator(COMPOSE, 'name', 'file');

export const COMPOSE_SUCCEEDED = 'COMPOSE_SUCCEEDED';
export const composeSucceeded = makeActionCreator(COMPOSE_SUCCEEDED);

export const COMPOSE_FAILED = 'COMPOSE_FAILED';
export const composeFailed = makeActionCreator(COMPOSE_FAILED, 'error');

export const OPEN_LOGS = 'OPEN_LOGS';
export const openLogs = makeActionCreator(OPEN_LOGS, 'id');

export const CLOSE_LOGS = 'CLOSE_LOGS';
export const closeLogs = makeActionCreator(CLOSE_LOGS);

export const ADD_LOG = 'ADD_LOG';
export const addLog = makeActionCreator(ADD_LOG, 'log');
