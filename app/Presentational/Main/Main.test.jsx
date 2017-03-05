/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import Main from './Main';

describe('Main', () => {
  it('should always render as a span', () => {
    const wrapper = shallow((
      <Main>
        <span />
      </Main>
    ));

    expect(wrapper.type()).to.equal('span');
  });

  it('should wrap content into article', () => {
    const wrapper = shallow((
      <Main>
        <span />
      </Main>
    ));

    expect(wrapper.find('article').length).to.equal(1);
  });
});
