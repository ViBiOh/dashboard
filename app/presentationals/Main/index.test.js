import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import Main from './';

test('should always render as a span', (t) => {
  t.is(
    shallow(
      <Main>
        <span />
      </Main>,
    ).type(),
    'span',
  );
});

test('should wrap content into article', (t) => {
  t.is(
    shallow(
      <Main>
        <span />
      </Main>,
    ).find('article').length,
    1,
  );
});
