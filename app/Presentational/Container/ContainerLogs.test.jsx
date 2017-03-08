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
});
