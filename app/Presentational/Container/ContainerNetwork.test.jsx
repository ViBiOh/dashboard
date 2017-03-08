/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerNetwork from './ContainerNetwork';

describe('ContainerNetwork', () => {
  let wrapper;
  const container = {
    NetworkSettings: {},
  };

  beforeEach(() => {
    wrapper = shallow(<ContainerNetwork container={container} />);
  });

  it('should always render as a span', () => {
    expect(wrapper.type()).to.equal('span');
  });
});
