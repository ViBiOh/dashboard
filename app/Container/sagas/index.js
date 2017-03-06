import 'babel-polyfill';
import { call, put, fork, take, takeLatest, cancel } from 'redux-saga/effects';
import { eventChannel, delay } from 'redux-saga';
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
  closeLogs,
  addLog,
  OPEN_EVENTS,
  CLOSE_EVENTS,
  openEvents,
  closeEvents,
} from '../actions';

export function* loginSaga(action) {
  try {
    yield call(DockerService.login, action.username, action.password);
    yield [
      put(loginSucceeded()),
      put(fetchContainers()),
      put(openEvents()),
      put(push('/')),
    ];
  } catch (e) {
    yield put(loginFailed(String(e)));
  }
}

export function* logoutSaga() {
  try {
    yield call(DockerService.logout);
    yield [
      put(logoutSucceeded()),
      put(closeEvents()),
      put(closeLogs()),
      put(push('/login')),
    ];
  } catch (e) {
    yield put(logoutFailed(String(e)));
  }
}

export function* fetchContainersSaga() {
  try {
    const containers = yield call(DockerService.containers);
    yield put(fetchContainersSucceeded(containers));
  } catch (e) {
    yield put(fetchContainersFailed(String(e)));
  }
}

export function* fetchContainerSaga(action) {
  try {
    const container = yield call(DockerService.infos, action.id);
    yield put(fetchContainerSucceeded(container));
  } catch (e) {
    yield put(fetchContainerFailed(String(e)));
  }
}

export function* actionContainerSaga(action) {
  try {
    yield call(DockerService[action.action], action.id);
    yield put(actionContainerSucceeded());

    if (action.action !== 'delete') {
      yield put(fetchContainer(action.id));
    } else {
      yield put(push('/'));
    }
  } catch (e) {
    yield put(actionContainerFailed(String(e)));
  }
}

export function* composeSaga(action) {
  try {
    yield call(DockerService.create, action.name, action.file);

    yield [
      put(composeSucceeded()),
      put(push('/')),
    ];
  } catch (e) {
    yield put(composeFailed(String(e)));
  }
}

export function* readLogsSaga(action) {
  const chan = eventChannel((emit) => {
    const websocket = DockerService.logs(action.id, emit);

    return () => websocket.close();
  });

  try {
    while (true) { // eslint-disable-line no-constant-condition
      const log = yield take(chan);
      yield put(addLog(log));
    }
  } finally {
    chan.close();
  }
}

export function* logsSaga(action) {
  const task = yield fork(readLogsSaga, action);

  yield take(CLOSE_LOGS);
  yield cancel(task);
}

export function* debounceFetchContainers() {
  yield call(delay, 5555);
  yield put(fetchContainers());
}

export function* readEventsSaga() {
  const chan = eventChannel((emit) => {
    const websocket = DockerService.events(emit);

    return () => websocket.close();
  });

  let task;
  try {
    while (true) { // eslint-disable-line no-constant-condition
      yield take(chan);
      if (task) {
        yield cancel(task);
      }
      task = yield fork(debounceFetchContainers);
    }
  } finally {
    chan.close();
  }
}

export function* eventsSaga(action) {
  const task = yield fork(readEventsSaga, action);

  yield take(CLOSE_EVENTS);
  yield cancel(task);
}

function* appSaga() {
  yield takeLatest(LOGIN, loginSaga);
  yield takeLatest(LOGOUT, logoutSaga);
  yield takeLatest(FETCH_CONTAINERS, fetchContainersSaga);
  yield takeLatest(FETCH_CONTAINER, fetchContainerSaga);
  yield takeLatest(ACTION_CONTAINER, actionContainerSaga);
  yield takeLatest(COMPOSE, composeSaga);
  yield takeLatest(OPEN_LOGS, logsSaga);
  yield takeLatest(OPEN_EVENTS, eventsSaga);
}

export default appSaga;
