import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import Stats from './index';

test('should render as a span', t => {
  const wrapper = shallow(<Stats />);

  t.is(wrapper.type(), 'span');
});

test('should not render Graph if entries are empty is not provided', t => {
  const wrapper = shallow(<Stats />);

  t.is(wrapper.find('Graph').length, 0);
});

test('should display logs if given', t => {
  const wrapper = shallow(
    <Stats
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
