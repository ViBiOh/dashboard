import test from 'ava';
import SearchParams, { computeRedirectSearch } from './SearchParams';

test('should computeRedirectSearch for an undefined params', t => {
  t.is(computeRedirectSearch(), '');
});

test('should computeRedirectSearch for blank string', t => {
  t.is(computeRedirectSearch('   '), '');
});

test('should computeRedirectSearch for given string', t => {
  t.is(computeRedirectSearch('list'), '?redirect=list');
});

test('should computeRedirectSearch with encode URI', t => {
  t.is(computeRedirectSearch('list?ordered'), '?redirect=list%3Fordered');
});

test('should works with empty value', t => {
  t.deepEqual(SearchParams(), {});
});

test('should works with blank value', t => {
  t.deepEqual(SearchParams('?'), {});
});

test('should works with simple value', t => {
  t.deepEqual(SearchParams('?key=value'), { key: 'value' });
});

test('should works with truthy and number values', t => {
  t.deepEqual(SearchParams('?key=value&ok&item=12'), { key: 'value', ok: true, item: '12' });
});

test('should works with encoded values', t => {
  t.deepEqual(SearchParams('?key=value&ok&item=%3Ftest%3Dtrue'), {
    key: 'value',
    ok: true,
    item: '?test=true',
  });
});
