import 'babel-polyfill';
import { call, put, fork, take, takeLatest, cancel } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import actions from '../actions';

/**
 * Handle error on sagas. Redirect to login if status is 401.
 * @param  {String} calledAction Action to call with given error
 * @param  {Error} error         Error summoned
 * @return {Object}              Actions to perform
 */
export function onErrorAction(calledAction, error) {
  if (error.status === 401 || error.noAuth) {
    return push('/login');
  }
  return actions[calledAction](String(error));
}

/**
 * Saga of Going back action :
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* goHomeSaga() {
  yield [put(actions.setError('')), put(push('/'))];
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
    yield [put(actions.loginSucceeded()), put(actions.info()), put(push('/'))];
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
      put(actions.closeBus()),
      put(actions.setError('')),
      put(push('/login')),
    ];
  } catch (e) {
    yield put(onErrorAction('logoutFailed', e));
  }
}

/**
 * Saga of Info action
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* infoSaga() {
  try {
    const infos = yield call(DockerService.info);

    const nextActions = [actions.infoSucceeded(infos)];
    nextActions.push(actions.openBus());
    nextActions.push(actions.fetchContainers());
    if (infos.Swarm && infos.Swarm.NodeID) {
      nextActions.push(actions.fetchServices());
    }

    yield nextActions.map(a => put(a));
  } catch (e) {
    yield put(onErrorAction('infoFailed', e));
  }
}

/**
 * Saga of Fetch services action :
 * - Fetch containers
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* fetchServicesSaga() {
  try {
    const services = yield call(DockerService.services);
    yield put(actions.fetchServicesSucceeded(services));
  } catch (e) {
    yield put(onErrorAction('fetchServicesFailed', e));
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
    yield put(onErrorAction('fetchContainersFailed', e));
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
    const container = yield call(DockerService.containerInfos, action.id);
    yield put(actions.fetchContainerSucceeded(container));
  } catch (e) {
    yield put(onErrorAction('fetchContainerFailed', e));
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

    if (!/delete$/i.test(action.action)) {
      yield put(actions.fetchContainer(action.id));
    } else {
      yield put(push('/'));
    }
  } catch (e) {
    yield put(onErrorAction('actionContainerFailed', e));
  }
}

/**
 * Saga of creating new Docker's container from Compose file :
 * - Create a new app from Compose
 * - Redirect to home otherwise
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* composeSaga(action) {
  try {
    yield call(DockerService.containerCreate, action.name, action.file);
    yield [put(actions.composeSucceeded()), put(push('/'))];
  } catch (e) {
    yield put(onErrorAction('composeFailed', e));
  }
}

export function* writeBusSaga(websocket) {
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const action = yield take([
        actions.OPEN_EVENTS,
        actions.OPEN_LOGS,
        actions.OPEN_STATS,
        actions.CLOSE_EVENTS,
        actions.CLOSE_LOGS,
        actions.CLOSE_STATS,
      ]);
      yield call(websocket.send, action.payload);
    }
  } finally {
    yield [
      call(websocket.send, actions.closeEvents().payload),
      call(websocket.send, actions.closeLogs().payload),
      call(websocket.send, actions.closeStats().payload),
    ];
  }
}

/**
 * Saga of reading bus' stream :
 * - Create a channel to handle every input
 * - Handle every put
 * @param {Object} action Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* readBusSaga(action) {
  let websocket;
  const chan = eventChannel((emit) => {
    websocket = DockerService.streamBus(emit);

    return () => websocket.close();
  });

  let task;
  try {
    task = yield fork(writeBusSaga, websocket);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const bus = yield take(chan);

      let demand;
      bus.replace(/^(\S+) (.*)$/, (all, type, content) => {
        if (type === 'stats') {
          demand = actions.addStat(JSON.parse(content));
        } else if (type === 'logs') {
          demand = actions.addLog(content);
        } else if (type === 'events') {
          demand = action.fetchContainers();
        }
      });

      if (demand) {
        yield put(demand);
      }
    }
  } finally {
    chan.close();
    yield cancel(task);
  }
}

/**
 * Saga of handling bus' stream:
 * - Fork the reading channel
 * - Handle close request
 * @param {Object} action Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* busSaga(action) {
  const task = yield fork(readBusSaga, action);

  yield take(actions.CLOSE_BUS);
  yield cancel(task);
}

/**
 * Sagas of app.
 * @yield {Function} Sagas
 */
export default function* appSaga() {
  yield takeLatest(actions.GO_HOME, goHomeSaga);
  yield takeLatest(actions.LOGIN, loginSaga);
  yield takeLatest(actions.LOGOUT, logoutSaga);
  yield takeLatest(actions.INFO, infoSaga);
  yield takeLatest(actions.FETCH_SERVICES, fetchServicesSaga);
  yield takeLatest(actions.FETCH_CONTAINERS, fetchContainersSaga);
  yield takeLatest(actions.FETCH_CONTAINER, fetchContainerSaga);
  yield takeLatest(actions.ACTION_CONTAINER, actionContainerSaga);
  yield takeLatest(actions.COMPOSE, composeSaga);
  yield takeLatest(actions.OPEN_BUS, busSaga);
}
