import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import Wrapper from './index';

function defaultProps() {
  return {
    component: <span />,
  };
}

test('should always render as a div', t => {
  t.is(shallow(<Wrapper {...defaultProps()} />).type(), 'span');
});
