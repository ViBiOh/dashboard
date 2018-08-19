import 'babel-polyfill';
import { call, put, fork, take, takeLatest, cancel, all } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import { push } from 'react-router-redux';
import { STORAGE_KEY_AUTH } from '../Constants';
import Docker from '../services/Docker';
import localStorage from '../services/LocalStorage';
import Auth from '../services/Auth';
import SearchParams, { computeRedirectSearch } from '../utils/SearchParams';
import actions from '../actions';

/**
 * Handle error on sagas. Redirect to login if status is 401.
 * @param  {String} calledAction Action to call with given error
 * @param  {Error} error         Error summoned
 * @return {Object}              Actions to perform
 */
export function onErrorAction(calledAction, error) {
  if (error.status === 401 || error.noAuth) {
    let { redirect } = SearchParams(document.location.search);
    if (!redirect) {
      redirect = document.location.href
        .replace(document.location.origin, '')
        .replace(/^\/(?:login\/?)?/, '');
    }

    return push(`/login${computeRedirectSearch(redirect)}`);
  }
  return actions[calledAction](String(error));
}

/**
 * Saga of Going back action :
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* goHomeSaga({ redirect = '' }) {
  yield all([put(actions.setError('')), put(push(`/${redirect}`))]);
}

/**
 * Go to login page
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* goLoginSaga({ redirect = '' }) {
  yield all([put(actions.setError('')), put(push(`/login${computeRedirectSearch(redirect)}`))]);
}

/**
 * Saga of Login action :
 * - Login
 * - Fetch containers on succeed
 * - Open events stream
 * - Redirect to home
 * @param {Object} action Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* loginSaga(action) {
  try {
    const hash = yield call(Auth.basicLogin, action.username, action.password);

    yield all([
      call([localStorage, localStorage.setItem], STORAGE_KEY_AUTH, hash),
      put(actions.loginSucceeded()),
      put(actions.refresh()),
      put(actions.goHome(action.redirect)),
    ]);
  } catch (e) {
    yield put(actions.loginFailed(e));
  }
}

/**
 * Saga of GitHub Access Token retrieval
 * @param {Object} action Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* getGithubAccesTokenSaga(action) {
  try {
    const token = yield call(Auth.getGithubAccessToken, action.state, action.code);

    yield all([
      call([localStorage, localStorage.setItem], STORAGE_KEY_AUTH, `GitHub ${token}`),
      put(actions.getGithubAccessTokenSucceeded()),
      put(actions.refresh()),
      put(actions.goHome(action.redirect)),
    ]);
  } catch (e) {
    yield put(actions.getGithubAccessTokenFailed(e));
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
    yield all([
      call([localStorage, localStorage.removeItem], STORAGE_KEY_AUTH),
      put(actions.logoutSucceeded()),
      put(actions.closeBus()),
      put(actions.setError('')),
      put(push('/login')),
    ]);
  } catch (e) {
    yield put(onErrorAction('logoutFailed', e));
  }
}

/**
 * Saga of Refresh action
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* refreshSaga() {
  try {
    yield all([put(actions.openBus()), put(actions.fetchContainers())]);
  } catch (e) {
    yield put(onErrorAction('setError', e));
  }
}

/**
 * Saga of Fetch containers action :
 * - Fetch containers
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* fetchContainersSaga() {
  try {
    const containers = yield call(Docker.containers);
    yield put(actions.fetchContainersSucceeded(containers));
  } catch (e) {
    yield put(onErrorAction('fetchContainersFailed', e));
  }
}

/**
 * Saga of Fetch container action :
 * - Fetch container
 * @param {Object} action Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* fetchContainerSaga(action) {
  try {
    const container = yield call(Docker.containerInfos, action.id);
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
 * @param {Object} action Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* actionContainerSaga(action) {
  try {
    yield call(Docker[action.action], action.id);
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
    yield call(Docker.containerCreate, action.name, action.file);
    yield all([put(actions.composeSucceeded()), put(push('/'))]);
  } catch (e) {
    yield put(onErrorAction('composeFailed', e));
  }
}

/**
 * Saga of writing to bus stream
 * @param {Websocket} websocket     Opened websocket for stream
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* writeBusSaga(websocket) {
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const action = yield take([
        actions.OPEN_EVENTS,
        actions.CLOSE_EVENTS,
        actions.OPEN_LOGS,
        actions.CLOSE_LOGS,
        actions.OPEN_STATS,
        actions.CLOSE_STATS,
      ]);

      yield call([websocket, 'send'], action.payload);
    }
  } finally {
    yield all([
      call([websocket, 'send'], actions.closeEvents().payload),
      call([websocket, 'send'], actions.closeLogs().payload),
      call([websocket, 'send'], actions.closeStats().payload),
    ]);
  }
}

/**
 * Saga of reading from bus stream :
 * - Create a channel to handle every input
 * - Handle every put
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* readBusSaga() {
  let websocket;
  const chan = eventChannel(emit => {
    websocket = Docker.streamBus(emit);

    return () => websocket.close();
  });

  let task;
  try {
    task = yield fork(writeBusSaga, websocket);

    yield take(chan);
    yield all([put(actions.busOpened()), put(actions.openEvents())]);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const bus = yield take(chan);

      let demand;
      bus.replace(/^(\S+) (.*)$/, (_, type, content) => {
        if (type === 'stats') {
          demand = actions.addStat(JSON.parse(content));
        } else if (type === 'logs') {
          demand = actions.addLog(content);
        } else if (type === 'events') {
          demand = actions.fetchContainers();
        }
      });

      if (demand) {
        yield put(demand);
      }
    }
  } finally {
    chan.close();
    yield all([cancel(task), put(actions.busClosed())]);
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
 * Saga of handling changeFilter's stream:
 * - push filter in search history
 * @param {Object} action Action dispatched
 * @yield {Function} Saga effects to sequence flow of work
 */
export function* changeFilterSaga(action) {
  if (action.value) {
    yield put(push({ search: `?filter=${encodeURIComponent(action.value)}` }));
  } else {
    yield put(push({ search: '' }));
  }
}

/**
 * Sagas of app.
 * @yield {Function} Sagas
 */
export default function* appSaga() {
  yield takeLatest(actions.GO_HOME, goHomeSaga);
  yield takeLatest(actions.GO_LOGIN, goLoginSaga);
  yield takeLatest(actions.GET_GITHUB_ACCESS_TOKEN_REQUEST, getGithubAccesTokenSaga);
  yield takeLatest(actions.LOGIN_REQUEST, loginSaga);
  yield takeLatest(actions.LOGOUT_REQUEST, logoutSaga);
  yield takeLatest(actions.REFRESH, refreshSaga);
  yield takeLatest(actions.FETCH_CONTAINERS_REQUEST, fetchContainersSaga);
  yield takeLatest(actions.FETCH_CONTAINER_REQUEST, fetchContainerSaga);
  yield takeLatest(actions.ACTION_CONTAINER_REQUEST, actionContainerSaga);
  yield takeLatest(actions.COMPOSE_REQUEST, composeSaga);
  yield takeLatest(actions.OPEN_BUS, busSaga);
  yield takeLatest(actions.CHANGE_FILTER, changeFilterSaga);
}
