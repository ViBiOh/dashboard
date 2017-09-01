import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import Filter from './';

const defaultProps = {
  onChange: () => null,
};

test('should render as an input', (t) => {
  const wrapper = shallow(<Filter {...defaultProps} />);

  t.is(wrapper.find('input').length, 1);
});

test('should call given onChange method', (t) => {
  const onChange = sinon.spy();
  const wrapper = shallow(<Filter {...defaultProps} onChange={onChange} />);

  wrapper.simulate('change', { target: {} });

  t.true(onChange.called);
});
