/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import Main from './Main';

describe('Main', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(
      <Main>
        <span />
      </Main>,
    );
  });

  it('should always render as a span', () => {
    expect(wrapper.type()).to.equal('span');
  });

  it('should wrap content into article', () => {
    expect(wrapper.find('article').length).to.equal(1);
  });
});
