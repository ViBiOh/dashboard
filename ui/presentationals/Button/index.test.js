import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import Button from '.';

test('should always render as a button', t => {
  t.is(shallow(<Button />).type(), 'button');
});

test('should not wrap child', t => {
  const wrapper = shallow(
    <Button>
      <span>
First
      </span>
    </Button>,
  );

  t.is(wrapper.find('span').length, 1);
});

test('should wrap children in div', t => {
  const wrapper = shallow(
    <Button>
      <span>
First
      </span>
      <span>
Second
      </span>
    </Button>,
  );

  t.is(wrapper.find('div').length, 1);
});
