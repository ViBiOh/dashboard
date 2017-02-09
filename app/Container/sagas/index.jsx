import 'babel-polyfill';
import { call, fork, put, take, takeLatest, cancel } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import { FETCH_CONTAINERS, fetchContainersSucceeded, FETCH_CONTAINER, fetchContainerSucceeded,
  ACTION_CONTAINER_SUCCEEDED, LOGIN, LOGOUT, LOGIN_FAILED, loginSucceeded, loginFailed,
  setError } from '../actions';
import DockerService from '../../Service/DockerService';

function* fetchContainers() {
  try {
    const containers = yield call(DockerService.containers);
    yield put(fetchContainersSucceeded(containers));
  } catch (e) {
    yield put(setError(e.message));
  }
}

function* fetchContainer(action) {
  try {
    const container = yield call(DockerService.infos, action.id);
    yield put(fetchContainerSucceeded(container));
  } catch (e) {
    yield put(setError(e.message));
  }
}

function* login(username, password) {
  try {
    yield call(DockerService.login, username, password);
    yield put(loginSucceeded());
    yield put(push('/'));
  } catch (e) {
    yield put(loginFailed(e.content));
  }
}

function* loginFlow() {
  while (true) { // eslint-disable-line no-constant-condition
    const { username, password } = yield take(LOGIN);
    const task = yield fork(login, username, password);

    const action = yield take([LOGOUT, LOGIN_FAILED]);
    if (action.type === LOGOUT) {
      yield cancel(task);
    }
    yield call(DockerService.logout);
    yield put(push('/login'));
  }
}

function* appSaga() {
  yield takeLatest(FETCH_CONTAINERS, fetchContainers);
  yield takeLatest(FETCH_CONTAINER, fetchContainer);
  yield takeLatest(ACTION_CONTAINER_SUCCEEDED, fetchContainer);
  yield loginFlow();
}

export default appSaga;
