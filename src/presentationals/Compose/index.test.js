import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import Compose from './index';

const defaultProps = {
  onCompose: sinon.spy(),
  onBack: sinon.spy(),
};

test('should render into a span', t => {
  const wrapper = shallow(<Compose {...defaultProps} />);

  t.true(wrapper.find('span').length >= 1);
});

test('should have a h2 title', t => {
  const wrapper = shallow(<Compose {...defaultProps} />);

  t.is(wrapper.find('h2').text(), 'Create an app');
});
