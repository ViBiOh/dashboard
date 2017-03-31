import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { mount } from 'enzyme';
import Compose from './Compose';

test('should render into a span', (t) => {
  const onCompose = sinon.spy();
  const onBack = sinon.spy();
  const wrapper = mount(<Compose onCompose={onCompose} onBack={onBack} />);

  t.true(wrapper.find('span').length >= 1);
});

test('should have a h2 title', (t) => {
  const onCompose = sinon.spy();
  const onBack = sinon.spy();
  const wrapper = mount(<Compose onCompose={onCompose} onBack={onBack} />);

  t.is(wrapper.find('h2').text(), 'Create an app');
});

test('should call given onCompose method', (t) => {
  const onCompose = sinon.spy();
  const onBack = sinon.spy();
  const wrapper = mount(<Compose onCompose={onCompose} onBack={onBack} />);

  wrapper.find('ThrobberButton').simulate('click');

  t.true(onCompose.called);
});

test('should call submit on enter key down', (t) => {
  const onCompose = sinon.spy();
  const onBack = sinon.spy();
  const wrapper = mount(<Compose onCompose={onCompose} onBack={onBack} />);

  wrapper.find('input').simulate('keyDown', { keyCode: 13 });

  t.true(onCompose.called);
});

test('should not call submit on other key down', (t) => {
  const onCompose = sinon.spy();
  const onBack = sinon.spy();
  const wrapper = mount(<Compose onCompose={onCompose} onBack={onBack} />);

  wrapper.find('textarea').simulate('keyDown', { keyCode: 10 });

  t.false(onCompose.called);
});
