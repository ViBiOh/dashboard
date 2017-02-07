import 'babel-polyfill';
import { call, put, takeLatest } from 'redux-saga/effects';
import { FETCH_CONTAINERS, containerListSucceed, error } from '../actions';
import DockerService from '../../Service/DockerService';

// worker Saga: will be fired on USER_FETCH_REQUESTED actions
function* fetchContainers() {
  try {
    const containers = yield call(DockerService.containers);
    yield put(containerListSucceed(containers));
  } catch (e) {
    yield put(error(e.message));
  }
}

function* appSaga() {
  yield takeLatest(FETCH_CONTAINERS, fetchContainers);
}

export default appSaga;
