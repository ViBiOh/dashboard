import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import Throbber from './Throbber';

test('should render into a div', (t) => {
  t.is(shallow(<Throbber />).type(), 'div');
});

test('should have no label by default', (t) => {
  t.is(shallow(<Throbber />).find('span').length, 0);
});

test('should have label when given', (t) => {
  t.is(shallow(<Throbber label="test" />).find('span').text(), 'test');
});

test('should have no label if vertical', (t) => {
  t.is(shallow(<Throbber label="test" vertical />).find('span').length, 0);
});

test('should have 4 styles if vertical and row-responsive', (t) => {
  const wrapper = shallow(<Throbber white vertical horizontalSm />).find('div').at(1);
  t.is(wrapper.prop('className').split(' ').length, 4);
});
