/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import Throbber from './Throbber';

describe('Throbber', () => {
  it('should render into a div', () => {
    const wrapper = shallow(<Throbber />);

    expect(wrapper.type()).to.equal('div');
  });

  it('should have no label by default', () => {
    const wrapper = shallow(<Throbber />);

    expect(wrapper.find('span').length).to.equal(0);
  });

  it('should have label when given', () => {
    const wrapper = shallow(<Throbber label="test" />);

    expect(wrapper.find('span').text()).to.equal('test');
  });
});
