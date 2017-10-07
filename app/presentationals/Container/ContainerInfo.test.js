import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerInfo from './ContainerInfo';

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

test('should always render as a span', (t) => {
  const wrapper = shallow(<ContainerInfo
    container={{
        ...container,
        State: {
          ...container.State,
          Running: true,
        },
      }}
  />);

  t.is(wrapper.type(), 'span');
});

test('should not render Labels if empty', (t) => {
  const wrapper = shallow(<ContainerInfo container={container} />);
  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Labels').length, 0);
});

test('should render Labels if present', (t) => {
  const wrapper = shallow(<ContainerInfo
    container={{
        ...container,
        Config: {
          ...container.Config,
          Labels: {
            first: 'Value',
            second: 'Test',
          },
        },
      }}
  />);

  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Labels').length, 1);
  t.is(
    wrapper.find('span').filterWhere(n => /^(first|second)\s*\|\s*\S+$/.test(n.text())).length,
    2,
  );
});

test('should not render Environment if empty', (t) => {
  const wrapper = shallow(<ContainerInfo container={container} />);
  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Environment').length, 0);
});

test('should render Environment if present', (t) => {
  const wrapper = shallow(<ContainerInfo
    container={{
        ...container,
        Config: {
          ...container.Config,
          Env: [null, '', 'first Value', 'first=Value', 'second=Test'],
        },
      }}
  />);

  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Environment').length, 1);
  t.is(
    wrapper.find('span').filterWhere(n => /^(first|second)\s*\|\s*\S+$/.test(n.text())).length,
    2,
  );
});

test('should not render Restart Policy if empty', (t) => {
  const wrapper = shallow(<ContainerInfo container={container} />);
  t.is(wrapper.find('span').filterWhere(n => /^Restart\s*\|\s*\S+$/.test(n.text())).length, 0);
});

test('should render Restart Policy if present', (t) => {
  const wrapper = shallow(<ContainerInfo
    container={{
        ...container,
        HostConfig: {
          ...container.HostConfig,
          RestartPolicy: {
            Name: 'on-failure',
            MaximumRetryCount: 5,
          },
        },
      }}
  />);

  t.is(
    wrapper.find('span').filterWhere(n => /^Restart\s*\|\s*on-failure:5+$/.test(n.text())).length,
    2,
  );
});

test('should render Restart Policy count if not present', (t) => {
  const wrapper = shallow(<ContainerInfo
    container={{
        ...container,
        HostConfig: {
          ...container.HostConfig,
          RestartPolicy: {
            Name: 'no',
            MaximumRetryCount: 0,
          },
        },
      }}
  />);

  t.is(wrapper.find('span').filterWhere(n => /^Restart\s*\|\s*no+$/.test(n.text())).length, 2);
});

test('should not render read-only if empty', (t) => {
  const wrapper = shallow(<ContainerInfo container={container} />);
  t.is(wrapper.find('span').filterWhere(n => /^read-only$/.test(n.text())).length, 0);
});

test('should render read-only if present', (t) => {
  const wrapper = shallow(<ContainerInfo
    container={{
        ...container,
        HostConfig: {
          ...container.HostConfig,
          ReadonlyRootfs: true,
        },
      }}
  />);

  t.is(wrapper.find('span').filterWhere(n => /^read-only$/.test(n.text())).length, 2);
});

test('should not render CpuShares if empty', (t) => {
  const wrapper = shallow(<ContainerInfo container={container} />);
  t.is(wrapper.find('span').filterWhere(n => /^CPU Shares\s*\|\s*\S+$/.test(n.text())).length, 0);
});

test('should render CpuShares if present', (t) => {
  const wrapper = shallow(<ContainerInfo
    container={{
        ...container,
        HostConfig: {
          ...container.HostConfig,
          CpuShares: 128,
        },
      }}
  />);

  t.is(wrapper.find('span').filterWhere(n => /^CPU Shares\s*\|\s*128$/.test(n.text())).length, 2);
});

test('should not render Memory limit if empty', (t) => {
  const wrapper = shallow(<ContainerInfo container={container} />);
  t.is(wrapper.find('span').filterWhere(n => /^Memory limit\s*\|\s*\S+$/.test(n.text())).length, 0);
});

test('should render Memory limit if present', (t) => {
  const wrapper = shallow(<ContainerInfo
    container={{
        ...container,
        HostConfig: {
          ...container.HostConfig,
          Memory: 134217728,
        },
      }}
  />);

  t.is(
    wrapper.find('span').filterWhere(n => /^Memory limit\s*\|\s*128 MB$/.test(n.text())).length,
    2,
  );
});

test('should not render Security Opt if empty', (t) => {
  const wrapper = shallow(<ContainerInfo container={container} />);
  t.is(wrapper.find('span').filterWhere(n => /^Security\s*\|\s*\S+$/.test(n.text())).length, 0);
});

test('should render Security Opt if present', (t) => {
  const wrapper = shallow(<ContainerInfo
    container={{
        ...container,
        HostConfig: {
          ...container.HostConfig,
          SecurityOpt: ['no-root', 'no-escalation'],
        },
      }}
  />);

  t.is(
    wrapper.find('span').filterWhere(n => /^Security\s*\|\s*no-root, no-escalation$/.test(n.text()))
      .length,
    2,
  );
});
