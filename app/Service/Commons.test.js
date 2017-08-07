import test from 'ava';
import { CONTENT_TYPE_HEADER, MEDIA_TYPE_JSON } from 'funtch';
import { customError } from './Commons';

test('should add toString to a rejected response', t =>
  customError({
    status: 400,
    headers: new Map(),
    text: () => Promise.resolve('error'),
  })
    .then(t.fail)
    .catch((err) => {
      t.true(typeof err.toString === 'function');
      t.is(String(err), 'error');
    }));

test('should add toString to a rejected response if JSON', t =>
  customError({
    status: 400,
    headers: new Map().set(CONTENT_TYPE_HEADER, MEDIA_TYPE_JSON),
    json: () => Promise.resolve({ content: 'error' }),
  })
    .then(t.fail)
    .catch((err) => {
      t.true(typeof err.toString === 'function');
      t.is(String(err), '{"content":"error"}');
    }));
