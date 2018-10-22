import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import { FaCloud } from 'react-icons/fa';
import Button from '../Button';
import ContainerCard from './index';

let props;
test.beforeEach(() => {
  props = {
    container: {
      Id: 1,
      Image: '',
      Created: 0,
      Status: 'up',
      Names: ['awesome_container'],
      Ports: [],
    },
    onClick: sinon.spy(),
  };
});

test('should always render as a Button', t => {
  const wrapper = shallow(<ContainerCard {...props} />);

  t.is(wrapper.type(), Button);
});

test("should call onClick with container's Id", t => {
  const wrapper = shallow(<ContainerCard {...props} />);
  wrapper.simulate('click');

  const { onClick } = props;
  t.true(onClick.withArgs('awesome_container').calledOnce);
});

test('should have red color on up', t => {
  const { container } = props;

  const wrapper = shallow(
    <ContainerCard {...props} container={{ ...container, Status: 'down' }} />,
  );

  t.true(wrapper.find('div').hasClass('undefined'));
});

test('should display owner if present', t => {
  const { container } = props;

  const wrapper = shallow(
    <ContainerCard {...props} container={{ ...container, Labels: { owner: 'test' } }} />,
  );

  t.is(wrapper.findWhere(e => e.text() === 'test').length, 1);
});

test('should display icon if container has external IP', t => {
  const { container } = props;

  const wrapper = shallow(
    <ContainerCard {...props} container={{ ...container, Ports: [{ IP: '0.0.0.0' }] }} />,
  );

  t.is(wrapper.find(FaCloud).length, 1);
});
