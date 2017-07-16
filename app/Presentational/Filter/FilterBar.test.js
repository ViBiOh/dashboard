import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import FilterBar from './FilterBar';

let defaultProps;

test.beforeEach(() => {
  defaultProps = {
    onChange: sinon.spy(),
  };
});

test('should render as an input', (t) => {
  const wrapper = shallow(<FilterBar {...defaultProps} />);

  t.is(wrapper.find('input').length, 1);
});

test('should call given onChange method', (t) => {
  const wrapper = shallow(<FilterBar {...defaultProps} />);

  wrapper.simulate('change', { target: {} });

  t.true(defaultProps.onChange.called);
});
