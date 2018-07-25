import test from 'ava';
import { call, put } from 'redux-saga/effects';
import { STORAGE_KEY_AUTH } from '../Constants';
import Auth from '../services/Auth';
import localStorage from '../services/LocalStorage';
import actions from '../actions';
import { getGithubAccesTokenSaga } from '.';

test('should call Auth.getGithubAccessToken with given state and code', t => {
  const iterator = getGithubAccesTokenSaga({
    state: 'state',
    code: 'secret',
  });

  t.deepEqual(iterator.next().value, call(Auth.getGithubAccessToken, 'state', 'secret'));
});

test('should store token, put success, fetching info and go home after API call', t => {
  const iterator = getGithubAccesTokenSaga({});
  iterator.next();

  t.deepEqual(iterator.next('githubToken').value, [
    call([localStorage, localStorage.setItem], STORAGE_KEY_AUTH, 'GitHub githubToken'),
    put(actions.getGithubAccessTokenSucceeded()),
    put(actions.refresh()),
    put(actions.goHome()),
  ]);
});

test('should put error on failure', t => {
  const iterator = getGithubAccesTokenSaga({});
  iterator.next();

  const err = new Error('Test');

  t.deepEqual(iterator.throw(err).value, put(actions.getGithubAccessTokenFailed(err)));
});
