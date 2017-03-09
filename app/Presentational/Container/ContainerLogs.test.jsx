/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerLogs from './ContainerLogs';

describe('ContainerLogs', () => {
  let wrapper;
  let openLogs;

  beforeEach(() => {
    openLogs = sinon.spy();

    wrapper = shallow(<ContainerLogs openLogs={openLogs} />);
  });

  it('should always render as a span', () => {
    expect(wrapper.type()).to.equal('span');
  });

  it('should display logs if given', () => {
    wrapper.setProps({ logs: [] });

    expect(wrapper.type()).to.equal('span');
    expect(wrapper.find('h3').text()).to.equal('Logs');
    expect(wrapper.find('pre').length).to.equal(1);
  });
});
