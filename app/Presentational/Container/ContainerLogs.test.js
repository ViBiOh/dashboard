import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerLogs from './ContainerLogs';

test('should always render as a span', (t) => {
  const openLogs = sinon.spy();
  const wrapper = shallow(<ContainerLogs openLogs={openLogs} />);

  t.is(wrapper.type(), 'span');
});

test('should display logs if given', (t) => {
  const openLogs = sinon.spy();
  const wrapper = shallow(<ContainerLogs openLogs={openLogs} />);
  wrapper.setProps({ logs: [] });

  t.is(wrapper.type(), 'span');
  t.is(wrapper.find('h3').text(), 'Logs');
  t.is(wrapper.find('pre').length, 1);
});
