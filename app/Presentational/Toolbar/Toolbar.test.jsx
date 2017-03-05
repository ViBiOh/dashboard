/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import Toolbar from './Toolbar';

describe('Toolbar', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Toolbar />);
  });

  it('should always render as a span', () => {
    expect(wrapper.type()).to.equal('span');
  });

  it('should display error in span if given', () => {
    wrapper.setProps({ error: 'failed' });

    expect(wrapper.find('span').at(1).text()).to.equal('failed');
  });
});
