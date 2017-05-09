import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerStats from './ContainerStats';

test('should not render if array is not provided', (t) => {
  const wrapper = shallow(<ContainerStats stats={null} />);

  t.is(wrapper.type(), null);
});

test('should display logs if given', (t) => {
  const wrapper = shallow(
    <ContainerStats
      stats={[
        {
          memory_stats: {
            usage: 2621440,
          },
        },
      ]}
    />,
  );

  t.is(wrapper.type(), 'span');
});
