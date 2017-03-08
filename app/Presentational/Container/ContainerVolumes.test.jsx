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

  it('should not render if no Mounts', () => {
    expect(wrapper.type()).to.equal(null);
  });

  it('should always render in a span and have a h3 title', () => {
    wrapper.setProps({
      container: {
        ...container,
        Mounts: [{
          Destination: '/www/',
          Source: '/home',
          Mode: 'ro',
        }],
      },
    });
    
    expect(wrapper.type()).to.equal('span');
    expect(wrapper.find('h3').text()).to.equal('Volumes');
  });
});
