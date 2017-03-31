import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import Toolbar from './Toolbar';

test('should always render as a span', (t) => {
  t.is(shallow(<Toolbar />).type(), 'span');
});

test('should display error in span if given', (t) => {
  t.is(shallow(<Toolbar error="failed" />).find('span').at(1).text(), 'failed');
});
