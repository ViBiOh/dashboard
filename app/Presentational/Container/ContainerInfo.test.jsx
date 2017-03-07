/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerInfo from '../Container/ContainerInfo';

describe('Container', () => {
  let wrapper;

  const container = {
    Args: [],
    Config: {
      Labels: {},
      Env: [],
    },
    HostConfig: {},
    NetworkSettings: {},
    Mounts: [],
    State: {},
  };

  beforeEach(() => {
    wrapper = shallow(<ContainerInfo container={container} />);
  });

  it('should always render as a span', () => {
    wrapper.setProps({
      container: {
        ...container,
        State: {
          ...container.State,
          Running: true,
        },
      },
    });

    expect(wrapper.type()).to.equal('span');
  });

  it('should not render Labels if empty', () => {
    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Labels').length).to.equal(0);
  });

  it('should render Labels if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        Config: {
          ...container.Config,
          Labels: {
            first: 'Value',
            second: 'Test',
          },
        },
      },
    });

    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Labels').length).to.equal(1);
    expect(
      wrapper.find('span').filterWhere(n => /^(first|second)\s*\|\s*\S+$/.test(n.text())).length,
    ).to.equal(2);
  });

  it('should not render Environment if empty', () => {
    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Environment').length).to.equal(0);
  });

  it('should render Environment if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        Config: {
          ...container.Config,
          Env: [
            null,
            '',
            'first Value',
            'first=Value',
            'second=Test',
          ],
        },
      },
    });

    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Environment').length).to.equal(1);
    expect(
      wrapper.find('span').filterWhere(n => /^(first|second)\s*\|\s*\S+$/.test(n.text())).length,
    ).to.equal(2);
  });

  it('should not render Restart Policy if empty', () => {
    expect(
      wrapper.find('span').filterWhere(n => /^Restart\s*\|\s*\S+$/.test(n.text())).length,
    ).to.equal(0);
  });

  it('should render Restart Policy if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        HostConfig: {
          ...container.HostConfig,
          RestartPolicy: {
            Name: 'on-failure',
            MaximumRetryCount: 5,
          },
        },
      },
    });

    expect(
      wrapper.find('span').filterWhere(n => /^Restart\s*\|\s*on-failure:5+$/.test(n.text())).length,
    ).to.equal(2);
  });

  it('should not render read-only if empty', () => {
    expect(
      wrapper.find('span').filterWhere(n => /^read-only$/.test(n.text())).length,
    ).to.equal(0);
  });

  it('should render read-only if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        HostConfig: {
          ...container.HostConfig,
          ReadonlyRootfs: true,
        },
      },
    });

    expect(
      wrapper.find('span').filterWhere(n => /^read-only$/.test(n.text())).length,
    ).to.equal(2);
  });

  it('should not render CpuShares if empty', () => {
    expect(
      wrapper.find('span').filterWhere(n => /^CPU Shares\s*\|\s*\S+$/.test(n.text())).length,
    ).to.equal(0);
  });

  it('should render CpuShares if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        HostConfig: {
          ...container.HostConfig,
          CpuShares: 128,
        },
      },
    });

    expect(
      wrapper.find('span').filterWhere(n => /^CPU Shares\s*\|\s*128$/.test(n.text())).length,
    ).to.equal(2);
  });

  it('should not render Memory limit if empty', () => {
    expect(
      wrapper.find('span').filterWhere(n => /^Memory limit\s*\|\s*\S+$/.test(n.text())).length,
    ).to.equal(0);
  });

  it('should render Memory limit if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        HostConfig: {
          ...container.HostConfig,
          Memory: 134217728,
        },
      },
    });

    expect(
      wrapper.find('span').filterWhere(n => /^Memory limit\s*\|\s*128 MB$/.test(n.text())).length,
    ).to.equal(2);
  });

  it('should not render Security Opt if empty', () => {
    expect(
      wrapper.find('span').filterWhere(n => /^Security\s*\|\s*\S+$/.test(n.text())).length,
    ).to.equal(0);
  });

  it('should render Security Opt if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        HostConfig: {
          ...container.HostConfig,
          SecurityOpt: [
            'no-root',
            'no-escalation',
          ],
        },
      },
    });

    expect(
      wrapper.find('span')
        .filterWhere(n => /^Security\s*\|\s*no-root, no-escalation$/.test(n.text())).length,
    ).to.equal(2);
  });
});
