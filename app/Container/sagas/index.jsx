import 'babel-polyfill';
import { call, put, takeLatest } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import {
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
  LOGIN,
  loginSucceeded,
  loginFailed,
  LOGOUT,
  logoutSucceeded,
  logoutFailed,
} from '../actions';

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

function* appSaga() {
  yield takeLatest(FETCH_CONTAINERS, fetchContainersSaga);
  yield takeLatest(FETCH_CONTAINER, fetchContainerSaga);
  yield takeLatest(ACTION_CONTAINER, actionContainerSaga);
  yield takeLatest(LOGIN, loginSaga);
  yield takeLatest(LOGOUT, logoutSaga);
}

export default appSaga;
