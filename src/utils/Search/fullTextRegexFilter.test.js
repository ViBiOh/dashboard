import test from 'ava';
import { fullTextRegexFilter } from './index';

test('should use given regex if provided', t => {
  t.true(fullTextRegexFilter('test unit dashboard', /unit/));
});

test('should build regex if not a regex', t => {
  t.true(fullTextRegexFilter('test unit dashboard', 'dashboard test'));
});

test('should ignore accent while matching value', t => {
  t.true(fullTextRegexFilter('test unit dashboard', 'dàshbôard'));
});

test('should ignore accent for given value', t => {
  t.true(fullTextRegexFilter('test unit dàshböard', 'dashboard'));
});
