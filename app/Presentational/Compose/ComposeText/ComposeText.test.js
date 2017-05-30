import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { mount, shallow } from 'enzyme';
import ComposeText from './ComposeText';

test('should render as a div', t => {
  t.is(
    shallow(
      <ComposeText onCompose={sinon.spy()} onComposeChange={sinon.spy()} onBack={sinon.spy()} />,
    ).type(),
    'div',
  );
});

test('should call onChange on input', t => {
  const onComposeChange = sinon.spy();
  const wrapper = mount(
    <ComposeText onCompose={sinon.spy()} onComposeChange={onComposeChange} onBack={sinon.spy()} />,
  );

  wrapper.find('input').simulate('change', 'test');

  t.true(onComposeChange.called);
});

test('should call submit on enter key down', t => {
  const onCompose = sinon.spy();
  const wrapper = mount(
    <ComposeText onCompose={onCompose} onComposeChange={sinon.spy()} onBack={sinon.spy()} />,
  );

  wrapper.find('input').simulate('keyDown', { keyCode: 13 });

  t.true(onCompose.called);
});

test('should not call submit on other key down', t => {
  const onCompose = sinon.spy();
  const wrapper = mount(
    <ComposeText onCompose={onCompose} onComposeChange={sinon.spy()} onBack={sinon.spy()} />,
  );

  wrapper.find('textarea').simulate('keyDown', { keyCode: 10 });

  t.false(onCompose.called);
});
