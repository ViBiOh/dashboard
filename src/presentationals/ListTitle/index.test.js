import React from 'react';
import test from 'ava';
import { shallow } from 'enzyme';
import ListTitle from './index';

function defaultProps() {
  return {
    onFilterChange: () => null,
  };
}

test('should always render as a span', t => {
  const props = defaultProps();
  const wrapper = shallow(<ListTitle {...props} />);
  t.is(wrapper.type(), 'span');
});

test('should display given count of containers', t => {
  const props = defaultProps();
  const wrapper = shallow(<ListTitle {...props} count="5 / 10" />);
  t.regex(wrapper.text(), /5 \/ 10/);
});
