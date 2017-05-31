import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ComposeTypeSelector from './ComposeTypeSelector';

const defaultProps = {
  compose: {},
  onCompose: sinon.spy(),
  onComposeChange: sinon.spy(),
};

test('should render into a span', (t) => {
  const wrapper = shallow(<ComposeTypeSelector {...defaultProps} />);

  t.is(wrapper.type(), 'div');
});

test('should render into a span', (t) => {
  const wrapper = shallow(<ComposeTypeSelector {...defaultProps} />);

  wrapper.find('input').at(0).simulate('change', {});

  t.is(wrapper.state().composeType.type, 'text');
});
