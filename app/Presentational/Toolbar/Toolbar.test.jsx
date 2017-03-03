/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { createRenderer } from 'react-addons-test-utils';
import Toolbar from './Toolbar';

describe('Toolbar', () => {
  const renderer = createRenderer();

  it('should always render as a span', () => {
    renderer.render(<Toolbar />);
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.type).to.equal('span');
  });

  it('should display error in span if given', () => {
    renderer.render(<Toolbar error="failed" />);
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.props.children[1].type).to.equal('span');
  });
});
