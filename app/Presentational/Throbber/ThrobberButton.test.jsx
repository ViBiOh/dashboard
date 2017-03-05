/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ThrobberButton from './ThrobberButton';
import Button from '../Button/Button';
import Throbber from './Throbber';

describe('ThrobberButton', () => {
  let wrapper;
  let onClick;

  beforeEach(() => {
    onClick = sinon.spy();

    wrapper = shallow(<ThrobberButton onClick={onClick} />);
  });

  it('should render as a Button', () => {
    expect(wrapper.type()).to.equal(Button);
  });

  it('should render with a Throbber if pending', () => {
    wrapper.setProps({ pending: true });
    expect(wrapper.find(Throbber).length).to.equal(1);
  });

  it('should render with children if not pending', () => {
    wrapper.setProps({
      children: <span>Test</span>,
    });

    expect(wrapper.find('span').length).to.equal(1);
  });

  it('should call onClick at click', () => {
    wrapper.simulate('click');

    expect(onClick.called).to.equal(true);
  });

  it('should not call onClick if pending', () => {
    wrapper.setProps({ pending: true });
    wrapper.simulate('click');

    expect(onClick.called).to.equal(false);
  });
});
