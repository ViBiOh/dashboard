/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ContainersList from './ContainersList';
import Toolbar from '../Toolbar/Toolbar';
import Throbber from '../Throbber/Throbber';
import ContainerCard from '../ContainerCard/ContainerCard';

describe('ContainersList', () => {
  let onRefresh;
  let onAdd;
  let onSelect;
  let onLogout;
  let wrapper;

  beforeEach(() => {
    onRefresh = sinon.spy();
    onAdd = sinon.spy();
    onSelect = sinon.spy();
    onLogout = sinon.spy();

    wrapper = shallow((
      <ContainersList onRefresh={onRefresh} onAdd={onAdd} onSelect={onSelect} onLogout={onLogout} />
    ));
  });

  it('should always render as a span with Toolbar', () => {
    expect(wrapper.type()).to.equal('span');
    expect(wrapper.find(Toolbar).length).to.equal(1);
  });

  it('should render a Throbber if pending', () => {
    wrapper.setProps({ pending: true });
    expect(wrapper.find(Throbber).length).to.equal(1);
  });

  it('should render a div list with ContainerCard if not pending', () => {
    wrapper.setProps({ containers: [{ Id: 1 }] });
    expect(wrapper.find('div').length).to.equal(1);
    expect(wrapper.find(ContainerCard).length).to.equal(1);
  });
});
