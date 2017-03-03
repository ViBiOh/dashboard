/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { createRenderer } from 'react-addons-test-utils';
import Throbber from './Throbber';

describe('Throbber', () => {
  const renderer = createRenderer();

  it('should render into a div', () => {
    renderer.render(<Throbber />);
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.type).to.equal('div');
  });

  it('should have no label by default', () => {
    renderer.render(<Throbber />);
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.props.children.type).to.not.equal('span');
  });

  it('should have label when given', () => {
    renderer.render(<Throbber label="test" />);
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.props.children[0].type).to.equal('span');
  });
});
