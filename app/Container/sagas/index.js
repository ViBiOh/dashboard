import 'babel-polyfill';
import { call, put, fork, take, takeLatest, cancel } from 'redux-saga/effects';
import { eventChannel, delay } from 'redux-saga';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import actions from '../actions';

/**
 * Handle error on sagas. Redirect to login if status is 401.
 * @param  {String} calledAction Action to call with given error
 * @param  {Error} error         Error summoned
 * @return {Array}               List of actions to put
 */
export function onErrorActions(calledAction, error) {
  const errorActions = [];

  if (error.status === 401) {
    errorActions.push(push('/login'));
  }
  errorActions.push(actions[calledAction](String(error)));

  return errorActions;
}

/**
 * Saga of Login action :
 * - Login
 * - Fetch containers on succeed
 * - Open events stream
 * - Redirect to home
 * @param {Object} action        Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* loginSaga(action) {
  try {
    yield call(DockerService.login, action.username, action.password);
    yield [
      put(actions.loginSucceeded()),
      put(actions.fetchContainers()),
      put(actions.openEvents()),
      put(push('/')),
    ];
  } catch (e) {
    yield put(actions.loginFailed(String(e)));
  }
}

/**
 * Saga of Logout action :
 * - Logout
 * - Close both streams (logs and events)
 * - Redirect to login
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* logoutSaga() {
  try {
    yield call(DockerService.logout);
    yield [
      put(actions.logoutSucceeded()),
      put(actions.closeEvents()),
      put(actions.closeLogs()),
      put(push('/login')),
    ];
  } catch (e) {
    yield onErrorActions('logoutFailed', e).map(a => put(a));
  }
}

/**
 * Saga of Fetch containers action :
 * - Fetch containers
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* fetchContainersSaga() {
  try {
    const containers = yield call(DockerService.containers);
    yield put(actions.fetchContainersSucceeded(containers));
  } catch (e) {
    yield onErrorActions('fetchContainersFailed', e).map(a => put(a));
  }
}

/**
 * Saga of Fetch container action :
 * - Fetch container
 * @param {Object} action        Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* fetchContainerSaga(action) {
  try {
    const container = yield call(DockerService.infos, action.id);
    yield put(actions.fetchContainerSucceeded(container));
  } catch (e) {
    yield onErrorActions('fetchContainerFailed', e).map(a => put(a));
  }
}

/**
 * Saga of make an action on a container :
 * - Execute action on container
 * - Fetch container if non-destructive action
 * - Redirect to home otherwise
 * @param {Object} action        Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* actionContainerSaga(action) {
  try {
    yield call(DockerService[action.action], action.id);
    yield put(actions.actionContainerSucceeded());

    if (action.action !== 'delete') {
      yield put(actions.fetchContainer(action.id));
    } else {
      yield put(push('/'));
    }
  } catch (e) {
    yield onErrorActions('actionContainerFailed', e).map(a => put(a));
  }
}

/**
 * Saga of creating new Docker's container from Compose file :
 * - Create a new app from Compose
 * - Redirect to home otherwise
 * @param {Object} action        Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* composeSaga(action) {
  try {
    yield call(DockerService.create, action.name, action.file);

    yield [
      put(actions.composeSucceeded()),
      put(push('/')),
    ];
  } catch (e) {
    yield onErrorActions('composeFailed', e).map(a => put(a));
  }
}

/**
 * Saga of reading logs' stream :
 * - Create a channel to handle every log
 * - Add log to state
 * @param {Object} action        Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* readLogsSaga(action) {
  const chan = eventChannel((emit) => {
    const websocket = DockerService.logs(action.id, emit);

    return () => websocket.close();
  });

  try {
    while (true) { // eslint-disable-line no-constant-condition
      const log = yield take(chan);
      yield put(actions.addLog(log));
    }
  } finally {
    chan.close();
  }
}

/**
 * Saga of handling logs' stream:
 * - Fork the reading channel
 * - Handle close request
 * @param {Object} action        Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* logsSaga(action) {
  const task = yield fork(readLogsSaga, action);

  yield take(actions.CLOSE_LOGS);
  yield cancel(task);
}

/**
 * Debounced fetch of containers.
 * Duration is based on the sleep servier-side before renaming containers.
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* debounceFetchContainersSaga() {
  yield call(delay, 5555);
  yield put(actions.fetchContainers());
}

/**
 * Saga of reading events' stream :
 * - Create a channel to handle every events
 * - Debounced fetch containers
 * @yield {Function} Saga effects to sequence flow of work
 */
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
      task = yield fork(debounceFetchContainersSaga);
    }
  } finally {
    chan.close();
  }
}

/**
 * Saga of handling events' stream:
 * - Fork the reading channel
 * - Handle close request
 * @param {Object} action        Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* eventsSaga() {
  const task = yield fork(readEventsSaga);

  yield take(actions.CLOSE_EVENTS);
  yield cancel(task);
}

/**
 * Sagas of app.
 * @yield {Function} Sagas
 */
export default function* appSaga() {
  yield takeLatest(actions.LOGIN, loginSaga);
  yield takeLatest(actions.LOGOUT, logoutSaga);
  yield takeLatest(actions.FETCH_CONTAINERS, fetchContainersSaga);
  yield takeLatest(actions.FETCH_CONTAINER, fetchContainerSaga);
  yield takeLatest(actions.ACTION_CONTAINER, actionContainerSaga);
  yield takeLatest(actions.COMPOSE, composeSaga);
  yield takeLatest(actions.OPEN_LOGS, logsSaga);
  yield takeLatest(actions.OPEN_EVENTS, eventsSaga);
}
