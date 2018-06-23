import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerLogs from './ContainerLogs';

test('should always render as a span', t => {
  const wrapper = shallow(<ContainerLogs />);

  t.is(wrapper.type(), 'span');
});

test('should display logs if given', t => {
  const wrapper = shallow(<ContainerLogs />);

  t.is(wrapper.type(), 'span');
  t.is(wrapper.find('h3').text(), 'Logs');
  t.is(wrapper.find('pre').length, 1);
});
