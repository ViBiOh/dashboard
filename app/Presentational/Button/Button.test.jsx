/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import Button from './Button';

describe('Button', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Button />);
  });

  it('should always render as a button', () => {
    expect(wrapper.type()).to.equal('button');
  });

  it('should not wrap child', () => {
    wrapper.setProps({
      children: <span>First</span>,
    });

    expect(wrapper.find('span').length).to.equal(1);
  });

  it('should wrap children in div', () => {
    wrapper.setProps({
      children: [
        <span key="first">First</span>,
        <span key="second">Second</span>,
      ],
    });

    expect(wrapper.find('div').length).to.equal(1);
  });
});
