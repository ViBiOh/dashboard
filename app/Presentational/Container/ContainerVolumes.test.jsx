/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerVolumes from './ContainerVolumes';

describe('ContainerVolumes', () => {
  let wrapper;

  const container = {
    Mounts: [],
  };

  beforeEach(() => {
    wrapper = shallow(<ContainerVolumes container={container} />);
  });

  it('should always render as a span', () => {
    expect(wrapper.type()).to.equal('span');
  });

  it('should have a h3 title', () => {
    expect(wrapper.find('h3').text()).to.equal('Volumes');
  });
});
