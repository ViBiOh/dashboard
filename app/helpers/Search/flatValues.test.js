import test from 'ava';
import { flatValues } from './';

test('should work with undefined', (t) => {
  t.deepEqual(flatValues(undefined), []);
});

test('should work with null', (t) => {
  t.deepEqual(flatValues(null), []);
});

test('should work with an array', (t) => {
  t.deepEqual(flatValues(['test', 0, false, null, undefined]), ['test', 0, false]);
});

test('should work with an object', (t) => {
  t.deepEqual(flatValues({ name: 'test', errors: 0, failed: false }), ['test', 0, false]);
});

test('should work with nested object in array', (t) => {
  t.deepEqual(
    flatValues({
      name: 'test',
      cases: [{ name: 'null' }, { name: 'undefined' }],
      errors: 0,
    }),
    ['test', 'null', 'undefined', 0],
  );
});

test('should work with other thing than array or object', (t) => {
  t.deepEqual(flatValues('string'), ['string']);
});
