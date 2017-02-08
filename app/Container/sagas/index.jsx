import 'babel-polyfill';
import { call, put, takeLatest } from 'redux-saga/effects';
import { FETCH_CONTAINERS, fetchContainersSucceed, FETCH_CONTAINER, fetchContainerSucceed,
  ACTION_CONTAINER_SUCCEED, setError } from '../actions';
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

function* appSaga() {
  yield takeLatest(FETCH_CONTAINERS, fetchContainers);
  yield takeLatest(FETCH_CONTAINER, fetchContainer);
  yield takeLatest(ACTION_CONTAINER_SUCCEED, fetchContainer);
}

export default appSaga;
