import 'babel-polyfill';
import { call, put, fork, take, takeLatest, cancel, cancelled } from 'redux-saga/effects';
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
  COMPOSE,
  composeSucceeded,
  composeFailed,
  OPEN_LOGS,
  CLOSE_LOGS,
  addLog,
} from '../actions';

export function* loginSaga(action) {
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

export function* logoutSaga() {
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

export function* fetchContainersSaga() {
  try {
    const containers = yield call(DockerService.containers);
    yield put(fetchContainersSucceeded(containers));
  } catch (e) {
    yield put(fetchContainersFailed(e.content));
  }
}

export function* fetchContainerSaga(action) {
  try {
    const container = yield call(DockerService.infos, action.id);
    yield put(fetchContainerSucceeded(container));
  } catch (e) {
    yield put(fetchContainerFailed(e.content));
  }
}

export function* actionContainerSaga(action) {
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

export function* composeSaga(action) {
  try {
    yield call(DockerService.create, action.name, action.file);

    yield [
      put(composeSucceeded()),
      put(fetchContainers()),
      put(push('/')),
    ];
  } catch (e) {
    yield put(composeFailed(e.content));
  }
}

export function* readLogs(action) {
  const chan = eventChannel(emit => DockerService.logs(action.id, log => emit(log)).close);

  try {
    while (true) { // eslint-disable-line no-constant-condition
      const log = yield take(chan);
      yield put(addLog(log));
    }
  } finally {
    if (yield cancelled()) {
      chan.close()
    }
  }
}

export function* logs(action) {
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
  yield takeLatest(COMPOSE, composeSaga);
  yield takeLatest(OPEN_LOGS, logs);
}

export default appSaga;
