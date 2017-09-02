import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import Toolbar from '../Toolbar';
import Throbber from '../Throbber';
import ThrobberButton from '../Throbber/ThrobberButton';
import Container from './Container';
import ContainerInfo from './ContainerInfo';
import ContainerNetwork from './ContainerNetwork';
import ContainerVolumes from './ContainerVolumes';
import ContainerLogs from './ContainerLogs';

const container = {
  Args: [],
  Config: {
    Labels: {},
    Env: [],
  },
  HostConfig: {},
  NetworkSettings: {},
  Mounts: [],
  State: {
    Running: true,
  },
};

test('should always render as a span', (t) => {
  const openLogs = sinon.spy();
  const onBack = sinon.spy();
  const onRefresh = sinon.spy();
  const onStart = sinon.spy();
  const onRestart = sinon.spy();
  const onStop = sinon.spy();
  const onDelete = sinon.spy();

  const wrapper = shallow(
    <Container
      openLogs={openLogs}
      onBack={onBack}
      onRefresh={onRefresh}
      onStart={onStart}
      onRestart={onRestart}
      onStop={onStop}
      onDelete={onDelete}
    />,
  );
  t.is(wrapper.type(), 'span');
});

test('should have a Toolbar', (t) => {
  const openLogs = sinon.spy();
  const onBack = sinon.spy();
  const onRefresh = sinon.spy();
  const onStart = sinon.spy();
  const onRestart = sinon.spy();
  const onStop = sinon.spy();
  const onDelete = sinon.spy();

  const wrapper = shallow(
    <Container
      openLogs={openLogs}
      onBack={onBack}
      onRefresh={onRefresh}
      onStart={onStart}
      onRestart={onRestart}
      onStop={onStop}
      onDelete={onDelete}
    />,
  );
  t.is(wrapper.find(Toolbar).length, 1);
});

test('should have a Throbber if pending', (t) => {
  const openLogs = sinon.spy();
  const onBack = sinon.spy();
  const onRefresh = sinon.spy();
  const onStart = sinon.spy();
  const onRestart = sinon.spy();
  const onStop = sinon.spy();
  const onDelete = sinon.spy();

  const wrapper = shallow(
    <Container
      openLogs={openLogs}
      onBack={onBack}
      onRefresh={onRefresh}
      onStart={onStart}
      onRestart={onRestart}
      onStop={onStop}
      onDelete={onDelete}
      pending
    />,
  );

  t.is(wrapper.find(Throbber).length, 1);
});

test('should have a display components if not pending', (t) => {
  const openLogs = sinon.spy();
  const onBack = sinon.spy();
  const onRefresh = sinon.spy();
  const onStart = sinon.spy();
  const onRestart = sinon.spy();
  const onStop = sinon.spy();
  const onDelete = sinon.spy();

  const wrapper = shallow(
    <Container
      openLogs={openLogs}
      onBack={onBack}
      onRefresh={onRefresh}
      onStart={onStart}
      onRestart={onRestart}
      onStop={onStop}
      onDelete={onDelete}
      pending={false}
      container={container}
    />,
  );

  t.is(wrapper.find(ContainerInfo).length, 1);
  t.is(wrapper.find(ContainerNetwork).length, 1);
  t.is(wrapper.find(ContainerVolumes).length, 1);
  t.is(wrapper.find(ContainerLogs).length, 1);
});

test('should have a two action button if up', (t) => {
  const openLogs = sinon.spy();
  const onBack = sinon.spy();
  const onRefresh = sinon.spy();
  const onStart = sinon.spy();
  const onRestart = sinon.spy();
  const onStop = sinon.spy();
  const onDelete = sinon.spy();

  const wrapper = shallow(
    <Container
      openLogs={openLogs}
      onBack={onBack}
      onRefresh={onRefresh}
      onStart={onStart}
      onRestart={onRestart}
      onStop={onStop}
      onDelete={onDelete}
      pending={false}
      container={container}
    />,
  );

  t.true(wrapper.find(ThrobberButton).length >= 2);
  t.is(wrapper.find('FaRetweet').length, 1);
  t.is(wrapper.find('FaStopCircle').length, 1);
});

test('should have a two action button if not up', (t) => {
  const openLogs = sinon.spy();
  const onBack = sinon.spy();
  const onRefresh = sinon.spy();
  const onStart = sinon.spy();
  const onRestart = sinon.spy();
  const onStop = sinon.spy();
  const onDelete = sinon.spy();

  const wrapper = shallow(
    <Container
      openLogs={openLogs}
      onBack={onBack}
      onRefresh={onRefresh}
      onStart={onStart}
      onRestart={onRestart}
      onStop={onStop}
      onDelete={onDelete}
      pending={false}
      container={{
        ...container,
        State: { Status: 'down', Running: false },
      }}
    />,
  );

  t.true(wrapper.find(ThrobberButton).length >= 2);
  t.is(wrapper.find('FaPlay').length, 1);
  t.is(wrapper.find('FaTrash').length, 1);
});
