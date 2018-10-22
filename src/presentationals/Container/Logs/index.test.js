import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import Logs from './index';

function defaultProps() {
  return {
    toggleFullScreenLogs: () => null,
  };
}

test('should always render as a span', t => {
  const wrapper = shallow(<Logs {...defaultProps()} />);

  t.is(wrapper.type(), 'span');
});

test('should display logs if given', t => {
  const wrapper = shallow(<Logs {...defaultProps()} />);

  t.is(wrapper.type(), 'span');
  t.is(wrapper.find('h3').text(), 'Logs');
  t.is(wrapper.find('pre').length, 1);
});
