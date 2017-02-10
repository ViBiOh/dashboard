import 'babel-polyfill';
import { call, put, takeLatest } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import {
  FETCH_CONTAINERS,
  fetchContainersSucceeded,
  fetchContainersFailed,
  FETCH_CONTAINER,
  fetchContainerSucceeded,
  fetchContainerFailed,
  ACTION_CONTAINER_SUCCEEDED,
  LOGIN,
  loginSucceeded,
  loginFailed,
  LOGOUT,
  logoutSucceeded,
  logoutFailed,
} from '../actions';

function* fetchContainers() {
  try {
    const containers = yield call(DockerService.containers);
    yield put(fetchContainersSucceeded(containers));
  } catch (e) {
    yield put(fetchContainersFailed(e.content));
  }
}

function* fetchContainer(action) {
  try {
    const container = yield call(DockerService.infos, action.id);
    yield put(fetchContainerSucceeded(container));
  } catch (e) {
    yield put(fetchContainerFailed(e.content));
  }
}

function* login(username, password) {
  try {
    yield call(DockerService.login, username, password);
    yield [
      put(loginSucceeded()),
      put(push('/')),
    ];
  } catch (e) {
    yield put(loginFailed(e.content));
  }
}

function* logout() {
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

function* appSaga() {
  yield takeLatest(FETCH_CONTAINERS, fetchContainers);
  yield takeLatest(FETCH_CONTAINER, fetchContainer);
  yield takeLatest(ACTION_CONTAINER_SUCCEEDED, fetchContainer);
  yield takeLatest(LOGIN, login);
  yield takeLatest(LOGOUT, logout);
}

export default appSaga;
