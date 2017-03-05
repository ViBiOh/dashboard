/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import Toolbar from './Toolbar';

describe('Toolbar', () => {
  it('should always render as a span', () => {
    const wrapper = shallow(<Toolbar />);

    expect(wrapper.type()).to.equal('span');
  });

  it('should display error in span if given', () => {
    const wrapper = shallow(<Toolbar error="failed" />);

    expect(wrapper.find('span').at(1).text()).to.equal('failed');
  });
});
