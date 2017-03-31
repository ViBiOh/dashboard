import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerNetwork from './ContainerNetwork';

const container = {
  NetworkSettings: {},
};

test('should always render as a span', (t) => {
  const wrapper = shallow(<ContainerNetwork container={container} />);

  t.is(wrapper.type(), 'span');
});

test('should not render Networks if empty', (t) => {
  const wrapper = shallow(<ContainerNetwork container={container} />);

  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Networks').length, 0);
});

test('should render Networks if present', (t) => {
  const wrapper = shallow(
    <ContainerNetwork
      container={{
        ...container,
        NetworkSettings: {
          ...container.NetworkSettings,
          Networks: {
            bridge: {
              IPAddress: '8.8.8.8',
            },
            loop: {
              IPAddress: '127.0.0.1',
            },
          },
        },
      }}
    />);

  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Networks').length, 1);
  t.is(wrapper.find('span').filterWhere(n => /^bridge\s*\|\s*8.8.8.8$/.test(n.text())).length, 1);
  t.is(wrapper.find('span').filterWhere(n => /^loop\s*\|\s*127.0.0.1$/.test(n.text())).length, 1);
});

test('should not render Links if empty', (t) => {
  const wrapper = shallow(<ContainerNetwork container={container} />);

  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Links').length, 0);
});

test('should render Links if present', (t) => {
  const wrapper = shallow(
    <ContainerNetwork
      container={{
        ...container,
        NetworkSettings: {
          ...container.NetworkSettings,
          Networks: {
            bridge: {
              Links: ['mysql:db'],
            },
          },
        },
      }}
    />);

  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Links').length, 1);
  t.is(wrapper.find('span').filterWhere(n => /^mysql\s*\|\s*db$/.test(n.text())).length, 2);
});

test('should not render Ports if empty', (t) => {
  const wrapper = shallow(<ContainerNetwork container={container} />);

  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Ports').length, 0);
});

test('should render Ports if present', (t) => {
  const wrapper = shallow(
    <ContainerNetwork
      container={{
        ...container,
        NetworkSettings: {
          ...container.NetworkSettings,
          Ports: {
            8080: [{
              HostPort: '80',
            }, {
              HostPort: '443',
            }],
          },
        },
      }}
    />);

  t.is(wrapper.find('h3').filterWhere(n => n.text() === 'Ports').length, 1);
  t.is(wrapper.find('span').filterWhere(n => /^8080\s*\|\s*80, 443$/.test(n.text())).length, 2);
});
