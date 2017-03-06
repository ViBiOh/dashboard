/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import Container from './Container';
import Toolbar from '../Toolbar/Toolbar';
import Throbber from '../Throbber/Throbber';
import ThrobberButton from '../Throbber/ThrobberButton';
import ContainerInfo from '../Container/ContainerInfo';
import ContainerNetwork from '../Container/ContainerNetwork';
import ContainerVolumes from '../Container/ContainerVolumes';
import ContainerLogs from '../Container/ContainerLogs';

describe('Container', () => {
  let wrapper;
  let openLogs;
  let onBack;
  let onRefresh;
  let onStart;
  let onRestart;
  let onStop;
  let onDelete;

  const container = {
    Id: '1',
    Created: '',
    Config: {
      Image: 'test',
      Labels: {},
    },
    HostConfig: {
      ReadonlyRootfs: false,
    },
    NetworkSettings: {},
    Mounts: [],
    State: {
      Status: 'up',
      Running: true,
    },
  };

  beforeEach(() => {
    openLogs = sinon.spy();
    onBack = sinon.spy();
    onRefresh = sinon.spy();
    onStart = sinon.spy();
    onRestart = sinon.spy();
    onStop = sinon.spy();
    onDelete = sinon.spy();

    wrapper = shallow(
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
  });

  it('should always render as a span', () => {
    expect(wrapper.type()).to.equal('span');
  });

  it('should have a Toolbar', () => {
    expect(wrapper.find(Toolbar).length).to.equal(1);
  });

  it('should have a Throbber if pending', () => {
    wrapper.setProps({ pending: true });

    expect(wrapper.find(Throbber).length).to.equal(1);
  });

  it('should have a display components if not pending', () => {
    wrapper.setProps({ pending: false, container });

    expect(wrapper.find(ContainerInfo).length).to.equal(1);
    expect(wrapper.find(ContainerNetwork).length).to.equal(1);
    expect(wrapper.find(ContainerVolumes).length).to.equal(1);
    expect(wrapper.find(ContainerLogs).length).to.equal(1);
  });

  it('should have a two action button if up', () => {
    wrapper.setProps({ pending: false, container });

    expect(wrapper.find(ThrobberButton).length).to.be.at.least(2);
    expect(wrapper.find(ThrobberButton).at(1).find('span').text()).to.equal('Restart');
    expect(wrapper.find(ThrobberButton).at(2).find('span').text()).to.equal('Stop');
  });

  it('should have a two action button if not up', () => {
    wrapper.setProps({ pending: false, container: {
      ...container,
      State: { Status: 'down', Running: false },
    }});

    expect(wrapper.find(ThrobberButton).length).to.be.at.least(2);
    expect(wrapper.find(ThrobberButton).at(1).find('span').text()).to.equal('Start');
    expect(wrapper.find(ThrobberButton).at(2).find('span').text()).to.equal('Delete');
  });
});
