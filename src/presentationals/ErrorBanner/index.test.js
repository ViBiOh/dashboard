import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ErrorBanner from './index';

test('should not render if no error', t => {
  t.is(shallow(<ErrorBanner />).type(), null);
});

test('should render as div', t => {
  t.is(shallow(<ErrorBanner error="failed" />).type(), 'div');
});
