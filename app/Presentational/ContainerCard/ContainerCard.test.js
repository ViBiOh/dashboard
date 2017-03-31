import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerCard from './ContainerCard';
import Button from '../Button/Button';

const container = {
  Id: 1,
  Image: '',
  Created: 0,
  Status: 'up',
  Names: [],
};

test('should always render as a Button', (t) => {
  const onClick = sinon.spy();
  const wrapper = shallow(<ContainerCard onClick={onClick} container={container} />);

  t.is(wrapper.type(), Button);
});

test('should call onClick with container\'s Id', (t) => {
  const onClick = sinon.spy();
  const wrapper = shallow(<ContainerCard onClick={onClick} container={container} />);
  wrapper.simulate('click');

  t.true(onClick.withArgs(1).calledOnce);
});

test('should have red color on up', (t) => {
  const onClick = sinon.spy();
  const wrapper = shallow(<ContainerCard onClick={onClick} container={{ ...container, Status: 'down' }} />);

  t.true(wrapper.find('div').hasClass('undefined'));
});
