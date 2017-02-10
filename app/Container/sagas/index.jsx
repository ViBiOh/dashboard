import 'babel-polyfill';
import { call, put, fork, take, takeLatest, cancel } from 'redux-saga/effects';
import { eventChannel, END } from 'redux-saga';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import {
  LOGIN,
  loginSucceeded,
  loginFailed,
  LOGOUT,
  logoutSucceeded,
  logoutFailed,
  FETCH_CONTAINERS,
  fetchContainers,
  fetchContainersSucceeded,
  fetchContainersFailed,
  FETCH_CONTAINER,
  fetchContainer,
  fetchContainerSucceeded,
  fetchContainerFailed,
  ACTION_CONTAINER,
  actionContainerSucceeded,
  actionContainerFailed,
  OPEN_LOGS,
  CLOSE_LOGS,
  addLog,
} from '../actions';

function* loginSaga(action) {
  try {
    yield call(DockerService.login, action.username, action.password);
    yield [
      put(loginSucceeded()),
      put(push('/')),
    ];
  } catch (e) {
    yield put(loginFailed(e.content));
  }
}

function* logoutSaga() {
  try {
    yield call(DockerService.logout);
    yield [
      put(logoutSucceeded()),
      put(push('/login')),
    ];
  } catch (e) {
    yield put(logoutFailed(e.content));
  }
}

function* fetchContainersSaga() {
  try {
    const containers = yield call(DockerService.containers);
    yield put(fetchContainersSucceeded(containers));
  } catch (e) {
    yield put(fetchContainersFailed(e.content));
  }
}

function* fetchContainerSaga(action) {
  try {
    const container = yield call(DockerService.infos, action.id);
    yield put(fetchContainerSucceeded(container));
  } catch (e) {
    yield put(fetchContainerFailed(e.content));
  }
}

function* actionContainerSaga(action) {
  try {
    yield call(DockerService[action.action], action.id);
    yield put(actionContainerSucceeded());

    if (action.action !== 'delete') {
      yield put(fetchContainer(action.id));
    } else {
      yield [
        put(fetchContainers()),
        put(push('/')),
      ];
    }
  } catch (e) {
    yield put(actionContainerFailed(e.content));
  }
}

function* readLogs(action) {
  let socket;
  const websocketChannel = eventChannel((emit) => {
    socket = DockerService.logs(action.id, log => emit(log));

    socket.onclose = () => emit(END);

    return socket.close;
  });

  while (true) { // eslint-disable-line no-constant-condition
    const log = yield take(websocketChannel);
    yield put(addLog(log));
  }
}

function* logs(action) {
  const task = yield fork(readLogs, action);

  yield take(CLOSE_LOGS);
  yield cancel(task);
}

function* appSaga() {
  yield takeLatest(LOGIN, loginSaga);
  yield takeLatest(LOGOUT, logoutSaga);
  yield takeLatest(FETCH_CONTAINERS, fetchContainersSaga);
  yield takeLatest(FETCH_CONTAINER, fetchContainerSaga);
  yield takeLatest(ACTION_CONTAINER, actionContainerSaga);
  yield takeLatest(OPEN_LOGS, logs);
}

export default appSaga;
