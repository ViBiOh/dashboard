import test from 'ava';
import { computeRedirectSearch } from './SearchParams';

test('should computeRedirectSearch for an undefined params', (t) => {
  t.is(computeRedirectSearch(), '');
});

test('should computeRedirectSearch for blank string', (t) => {
  t.is(computeRedirectSearch('   '), '');
});

test('should computeRedirectSearch for given string', (t) => {
  t.is(computeRedirectSearch('list'), '?redirect=list');
});

test('should computeRedirectSearch with encode URI', (t) => {
  t.is(computeRedirectSearch('list?ordered'), '?redirect=list%3Fordered');
});
