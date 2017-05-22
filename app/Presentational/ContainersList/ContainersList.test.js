import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ContainersList from './ContainersList';

const fn = () => null;

test('should always render as a span with Toolbar', (t) => {
  const wrapper = shallow(<ContainersList onRefresh={fn} onAdd={fn} onSelect={fn} onLogout={fn} />);

  t.is(wrapper.type(), 'span');
  t.is(wrapper.find('Toolbar').length, 1);
});

test('should render a Throbber if pending', (t) => {
  const wrapper = shallow(
    <ContainersList onRefresh={fn} onAdd={fn} onSelect={fn} onLogout={fn} pending />,
  );

  t.is(wrapper.find('Throbber').length, 1);
});

test('should render a div list with ContainerCard if not pending', (t) => {
  const containers = [
    {
      Id: 1,
      Image: 'test',
      Created: 0,
      Status: 'up',
      Names: [],
    },
  ];

  const wrapper = shallow(
    <ContainersList
      onRefresh={fn}
      onAdd={fn}
      onSelect={fn}
      onLogout={fn}
      containers={containers}
    />,
  );

  t.is(wrapper.find('div').length, 1);
  t.is(wrapper.find('ContainerCard').length, 1);
});

test('should not render docker version if no infos', (t) => {
  const containers = [
    {
      Id: 1,
      Image: 'test',
      Created: 0,
      Status: 'up',
      Names: [],
    },
  ];

  const wrapper = shallow(
    <ContainersList
      onRefresh={fn}
      onAdd={fn}
      onSelect={fn}
      onLogout={fn}
      containers={containers}
    />,
  );

  t.is(wrapper.find('Toolbar Button').length, 3);
});

test('should not render docker version if no version', (t) => {
  const containers = [
    {
      Id: 1,
      Image: 'test',
      Created: 0,
      Status: 'up',
      Names: [],
    },
  ];

  const infos = {};

  const wrapper = shallow(
    <ContainersList
      onRefresh={fn}
      onAdd={fn}
      onSelect={fn}
      onLogout={fn}
      containers={containers}
      infos={infos}
    />,
  );

  t.is(wrapper.find('Toolbar Button').length, 3);
});

test('should render docker version if provided', (t) => {
  const containers = [
    {
      Id: 1,
      Image: 'test',
      Created: 0,
      Status: 'up',
      Names: [],
    },
  ];

  const infos = { ServerVersion: 1.12 };

  const wrapper = shallow(
    <ContainersList
      onRefresh={fn}
      onAdd={fn}
      onSelect={fn}
      onLogout={fn}
      containers={containers}
      infos={infos}
    />,
  );

  t.is(wrapper.find('Toolbar Button').length, 4);
  t.is(wrapper.find('Toolbar Button').at(2).dive().text(), '<GoVersions /> 1.12');
});

test('should render docker swarm node if provided', (t) => {
  const containers = [
    {
      Id: 1,
      Image: 'test',
      Created: 0,
      Status: 'up',
      Names: [],
    },
  ];

  const infos = { ServerVersion: 1.12, Swarm: { NodeID: 1, Nodes: 1 } };

  const wrapper = shallow(
    <ContainersList
      onRefresh={fn}
      onAdd={fn}
      onSelect={fn}
      onLogout={fn}
      containers={containers}
      infos={infos}
    />,
  );

  t.is(wrapper.find('Toolbar Button').length, 5);
  t.is(wrapper.find('Toolbar Button').at(2).dive().text(), '<GoVersions /> 1.12');
  t.is(wrapper.find('Toolbar Button').at(3).dive().text(), '<FaServer /> 1');
});
