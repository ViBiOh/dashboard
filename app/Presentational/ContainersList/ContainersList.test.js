import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ContainersList from './ContainersList';

const fn = () => null;

const defaultProps = {
  onRefresh: fn,
  onAdd: fn,
  onSelect: fn,
  onLogout: fn,
  onFilterChange: fn,
};

test('should always render as a span with Toolbar', (t) => {
  const wrapper = shallow(<ContainersList {...defaultProps} />);

  t.is(wrapper.type(), 'span');
  t.is(wrapper.find('Toolbar').length, 1);
});

test('should render a Throbber if pending', (t) => {
  const wrapper = shallow(<ContainersList {...defaultProps} pending />);

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
    <ContainersList {...defaultProps} containers={containers} containersTotalCount={1} />,
  );

  t.is(wrapper.find('div').length, 1);
  t.is(wrapper.find('ContainerCard').length, 1);
  t.is(wrapper.find('span').length, 3);
  t.is(wrapper.find('span').at(2).text(), '1<FaCubes /><FilterBar />');
});

test('should indicate filtered list', (t) => {
  const wrapper = shallow(
    <ContainersList {...defaultProps} containers={[]} containersTotalCount={1} />,
  );

  t.is(wrapper.find('span').at(2).text(), '0 / 1<FaCubes /><FilterBar />');
});
