import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import Toolbar from './index';

test('should always render as a span', t => {
  t.is(shallow(<Toolbar />).type(), 'span');
});
