import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerCard from './ContainerCard';
import Button from '../Button/Button';

let props;
test.beforeEach(() => {
  props = {
    container: {
      Id: 1,
      Image: '',
      Created: 0,
      Status: 'up',
      Names: [],
    },
    onClick: sinon.spy(),
  };
});

test('should always render as a Button', (t) => {
  const wrapper = shallow(<ContainerCard {...props} />);

  t.is(wrapper.type(), Button);
});

test("should call onClick with container's Id", (t) => {
  const wrapper = shallow(<ContainerCard {...props} />);
  wrapper.simulate('click');

  t.true(props.onClick.withArgs(1).calledOnce);
});

test('should have red color on up', (t) => {
  const wrapper = shallow(
    <ContainerCard {...props} container={{ ...props.container, Status: 'down' }} />,
  );

  t.true(wrapper.find('div').hasClass('undefined'));
});

test('should display owner if present', (t) => {
  const wrapper = shallow(
    <ContainerCard {...props} container={{ ...props.container, Labels: { owner: 'test' } }} />,
  );

  t.is(wrapper.findWhere(e => e.text() === 'test').length, 1);
});
