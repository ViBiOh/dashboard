import test from 'ava';
import { replaceAccentedChar } from './index';

test('should deal with undefined param', t => {
  t.is(replaceAccentedChar(), '');
});

test('should deal with null param', t => {
  t.is(replaceAccentedChar(null), '');
});

test('should remove commons french accented character', t => {
  t.is(replaceAccentedChar('àéìôùÿ'), 'aeiouy');
});
