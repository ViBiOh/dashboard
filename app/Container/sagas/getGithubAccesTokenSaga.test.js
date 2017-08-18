import test from 'ava';
import { call, put } from 'redux-saga/effects';
import { STORAGE_KEY_AUTH } from '../../Constants';
import AuthService from '../../Service/AuthService';
import localStorageService from '../../Service/LocalStorageService';
import actions from '../actions';
import { getGithubAccesTokenSaga } from './';

test('should call AuthService.getGithubAccessToken with given state and code', (t) => {
  const iterator = getGithubAccesTokenSaga({
    state: 'state',
    code: 'secret',
  });

  t.deepEqual(iterator.next().value, call(AuthService.getGithubAccessToken, 'state', 'secret'));
});

test('should store token, put success, fetching info and go home after API call', (t) => {
  const iterator = getGithubAccesTokenSaga({});
  iterator.next();

  t.deepEqual(iterator.next('githubToken').value, [
    call(
      [localStorageService, localStorageService.setItem],
      STORAGE_KEY_AUTH,
      'GitHub githubToken',
    ),
    put(actions.getGithubAccessTokenSucceeded()),
    put(actions.info()),
    put(actions.goHome()),
  ]);
});

test('should put error on failure', (t) => {
  const iterator = getGithubAccesTokenSaga({});
  iterator.next();

  t.deepEqual(
    iterator.throw(new Error('Test')).value,
    put(actions.getGithubAccessTokenFailed('Error: Test')),
  );
});
