import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import { FaRetweet, FaStopCircle, FaPlay, FaTrash } from 'react-icons/fa';
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

function defaultProps() {
  return {
    openLogs: () => null,
    onBack: () => null,
    onRefresh: () => null,
    onStart: () => null,
    onRestart: () => null,
    onStop: () => null,
    onDelete: () => null,
    toggleFullScreenLogs: () => null,
  };
}

test('should always render as a span', t => {
  const wrapper = shallow(<Container {...defaultProps()} />);
  t.is(wrapper.type(), 'span');
});

test('should have a Toolbar', t => {
  const wrapper = shallow(<Container {...defaultProps()} />);
  t.is(wrapper.find(Toolbar).length, 1);
});

test('should have a Throbber if pending', t => {
  const wrapper = shallow(<Container {...defaultProps()} pending />);

  t.is(wrapper.find(Throbber).length, 1);
});

test('should have a display components if not pending', t => {
  const wrapper = shallow(<Container {...defaultProps()} pending={false} container={container} />);

  t.is(wrapper.find(ContainerInfo).length, 1);
  t.is(wrapper.find(ContainerNetwork).length, 1);
  t.is(wrapper.find(ContainerVolumes).length, 1);
  t.is(wrapper.find(ContainerLogs).length, 1);
});

test('should have a two action button if up', t => {
  const wrapper = shallow(<Container {...defaultProps()} pending={false} container={container} />);

  t.true(wrapper.find(ThrobberButton).length >= 2);
  t.is(wrapper.find(FaRetweet).length, 1);
  t.is(wrapper.find(FaStopCircle).length, 1);
});

test('should have a two action button if not up', t => {
  const wrapper = shallow(
    <Container
      {...defaultProps()}
      pending={false}
      container={{
        ...container,
        State: { Status: 'down', Running: false },
      }}
    />,
  );

  t.true(wrapper.find(ThrobberButton).length >= 2);
  t.is(wrapper.find(FaPlay).length, 1);
  t.is(wrapper.find(FaTrash).length, 1);
});
