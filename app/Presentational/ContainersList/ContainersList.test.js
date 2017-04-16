import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ContainersList from './ContainersList';
import Toolbar from '../Toolbar/Toolbar';
import Throbber from '../Throbber/Throbber';
import ContainerCard from '../ContainerCard/ContainerCard';

test('should always render as a span with Toolbar', (t) => {
  const onRefresh = sinon.spy();
  const onAdd = sinon.spy();
  const onSelect = sinon.spy();
  const onLogout = sinon.spy();

  const wrapper = shallow(
    <ContainersList onRefresh={onRefresh} onAdd={onAdd} onSelect={onSelect} onLogout={onLogout} />,
  );

  t.is(wrapper.type(), 'span');
  t.is(wrapper.find(Toolbar).length, 1);
});

test('should render a Throbber if pending', (t) => {
  const onRefresh = sinon.spy();
  const onAdd = sinon.spy();
  const onSelect = sinon.spy();
  const onLogout = sinon.spy();

  const wrapper = shallow(
    <ContainersList
      onRefresh={onRefresh}
      onAdd={onAdd}
      onSelect={onSelect}
      onLogout={onLogout}
      pending
    />,
  );

  t.is(wrapper.find(Throbber).length, 1);
});

test('should render a div list with ContainerCard if not pending', (t) => {
  const onRefresh = sinon.spy();
  const onAdd = sinon.spy();
  const onSelect = sinon.spy();
  const onLogout = sinon.spy();

  const wrapper = shallow(
    <ContainersList
      onRefresh={onRefresh}
      onAdd={onAdd}
      onSelect={onSelect}
      onLogout={onLogout}
      containers={[
        {
          Id: 1,
          Image: 'test',
          Created: 0,
          Status: 'up',
          Names: [],
        },
      ]}
    />,
  );

  t.is(wrapper.find('div').length, 1);
  t.is(wrapper.find(ContainerCard).length, 1);
});
