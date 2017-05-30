import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ComposeTypeSelector from './ComposeTypeSelector';

test('should render into a span', (t) => {
  const wrapper = shallow(
    <ComposeTypeSelector onCompose={sinon.spy()} onComposeChange={sinon.spy()} />,
  );

  t.is(wrapper.type(), 'div');
});

test('should render into a span', (t) => {
  const wrapper = shallow(
    <ComposeTypeSelector onCompose={sinon.spy()} onComposeChange={sinon.spy()} />,
  );

  wrapper.find('input').at(0).simulate('change', {});

  t.is(wrapper.state().composeType.type, 'text');
});
