import 'babel-polyfill';
import { call, fork, put, take, takeLatest, cancel } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import { FETCH_CONTAINERS, fetchContainersSucceed, FETCH_CONTAINER, fetchContainerSucceed,
  ACTION_CONTAINER_SUCCEED, LOGIN, LOGOUT, LOGIN_FAILED, loginSucceed, loginFailed,
  setError } from '../actions';
import DockerService from '../../Service/DockerService';

function* fetchContainers() {
  try {
    const containers = yield call(DockerService.containers);
    yield put(fetchContainersSucceed(containers));
  } catch (e) {
    yield put(setError(e.message));
  }
}

function* fetchContainer(action) {
  try {
    const container = yield call(DockerService.infos, action.id);
    yield put(fetchContainerSucceed(container));
  } catch (e) {
    yield put(setError(e.message));
  }
}

function* login(username, password) {
  try {
    yield call(DockerService.login, username, password);
    yield put(loginSucceed());
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
  yield takeLatest(ACTION_CONTAINER_SUCCEED, fetchContainer);
  yield loginFlow();
}

export default appSaga;
