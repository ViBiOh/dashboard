import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import { DEBOUNCE_TIMEOUT } from '../../Constants';
import Filter from './';

const defaultProps = {
  onChange: () => null,
};

test('should render as an input', (t) => {
  const wrapper = shallow(<Filter {...defaultProps} />);

  t.is(wrapper.find('input').length, 1);
});

test('should update state on change', (t) => {
  const wrapper = shallow(<Filter {...defaultProps} />);

  wrapper.simulate('change', { target: { value: 'test' } });

  t.is(wrapper.state().value, 'test');
});

test('should call onChange after debounce', (t) => {
  const onChange = sinon.spy();
  const wrapper = shallow(<Filter {...defaultProps} onChange={onChange} />);

  wrapper.simulate('change', { target: { value: 'test' } });

  return new Promise((resolve) => {
    setTimeout(() => {
      t.true(onChange.called);
      resolve();
    }, DEBOUNCE_TIMEOUT + 50);
  });
});
