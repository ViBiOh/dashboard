/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerCard from './ContainerCard';
import Button from '../Button/Button';

describe('ContainerCard', () => {
  let wrapper;
  let onClick;

  const container = {
    Id: 1,
    Image: '',
    Created: 0,
    Status: 'up',
    Names: [],
  };

  beforeEach(() => {
    onClick = sinon.spy();

    wrapper = shallow((
      <ContainerCard onClick={onClick} container={container} />
    ));
  });

  it('should always render as a Button', () => {
    expect(wrapper.type()).to.equal(Button);
  });

  it('should call onClick with container\'s Id', () => {
    wrapper.simulate('click');

    expect(onClick.withArgs(1).calledOnce).to.equal(true);
  });

  it('should have red color on up', () => {
    wrapper.setProps({ container: { ...container, Status: 'down' } });

    expect(wrapper.find('div').hasClass('undefined')).to.equal(true);
  });
});
