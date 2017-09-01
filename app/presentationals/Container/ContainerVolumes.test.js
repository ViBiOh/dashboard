import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerVolumes from './ContainerVolumes';

const container = {
  Mounts: [],
};

test('should not render if no Mounts', (t) => {
  t.is(shallow(<ContainerVolumes container={container} />).type(), null);
});

test('should always render in a span and have a h3 title', (t) => {
  const wrapper = shallow(
    <ContainerVolumes
      container={{
        ...container,
        Mounts: [
          {
            Destination: '/www/',
            Source: '/home',
            Mode: 'ro',
          },
        ],
      }}
    />,
  );

  t.is(wrapper.type(), 'span');
  t.is(wrapper.find('h3').text(), 'Volumes');
});
