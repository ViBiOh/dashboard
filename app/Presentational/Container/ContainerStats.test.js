import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerStats from './ContainerStats';

test('should not render if stats is not provided', (t) => {
  const wrapper = shallow(<ContainerStats stats={null} />);

  t.is(wrapper.type(), null);
});

test('should not render if entries ar empty is not provided', (t) => {
  const wrapper = shallow(<ContainerStats stats={{ entries: [] }} />);

  t.is(wrapper.type(), null);
});

test('should display logs if given', (t) => {
  const wrapper = shallow(
    <ContainerStats
      stats={{
        cpuLimit: 800,
        memoryLimit: 16,
        memoryScale: 2,
        entries: [
          {
            cpu: 25.85,
            memory: 8.43,
          },
        ],
      }}
    />,
  );

  t.is(wrapper.type(), 'span');
});
