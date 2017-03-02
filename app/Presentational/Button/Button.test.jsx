/* eslint-disable import/no-extraneous-dependencies,react/no-find-dom-node */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import Button from './Button';

describe('Button', () => {
  const renderer = ReactTestUtils.createRenderer();
  let wrapper;

  beforeEach(() => {
    renderer.render(<Button />);
    wrapper = renderer.getRenderOutput();
  });

  it('should render empty as a button', () => {
    expect(wrapper.type).to.equal('button');
  });
});
