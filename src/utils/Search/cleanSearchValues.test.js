import test from 'ava';
import { cleanSearchValues } from './index';

test('should handle undefined param', t => {
  t.deepEqual(cleanSearchValues(), []);
});

test('should handle non-array @param', t => {
  t.deepEqual(cleanSearchValues('test'), []);
});

test('should not filter if under minimum value', t => {
  t.deepEqual(cleanSearchValues(['test', 'unit']), ['test', 'unit']);
});

test('should remove words below minimum', t => {
  t.deepEqual(cleanSearchValues(['test', 'of', 'unit']), ['test', 'unit']);
});

test('should not remove word if all below minimum', t => {
  t.deepEqual(cleanSearchValues(['of', 'ut', 'fr']), ['of', 'ut', 'fr']);
});
