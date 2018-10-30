import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import Graph from './index';

test('should render as canvas', t => {
  const wrapper = shallow(<Graph type="line" data={{}} options={{}} />);

  t.is(wrapper.type(), 'canvas');
});
