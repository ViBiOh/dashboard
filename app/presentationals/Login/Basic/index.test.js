import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { mount } from 'enzyme';
import BasicAuth from './';

test('should render into a span', (t) => {
  const onLogin = sinon.spy();
  const wrapper = mount(<BasicAuth onLogin={onLogin} />);

  t.true(wrapper.find('span').length >= 1);
});

test('should have a h2 title', (t) => {
  const onLogin = sinon.spy();
  const wrapper = mount(<BasicAuth onLogin={onLogin} />);

  t.is(wrapper.find('h2').text(), 'Login');
});

test('should call given onLogin method', (t) => {
  const onLogin = sinon.spy();
  const wrapper = mount(<BasicAuth onLogin={onLogin} />);

  wrapper.find('ThrobberButton').simulate('click');

  t.true(onLogin.called);
});

test('should call submit on enter key down', (t) => {
  const onLogin = sinon.spy();
  const wrapper = mount(<BasicAuth onLogin={onLogin} />);

  wrapper
    .find('input')
    .at(0)
    .simulate('keyDown', { keyCode: 13 });

  t.true(onLogin.called);
});

test('should not call submit on other key down', (t) => {
  const onLogin = sinon.spy();
  const wrapper = mount(<BasicAuth onLogin={onLogin} />);

  wrapper
    .find('input')
    .at(1)
    .simulate('keyDown', { keyCode: 10 });

  t.false(onLogin.called);
});
