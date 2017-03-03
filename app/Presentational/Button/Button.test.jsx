/* eslint-disable import/no-extraneous-dependencies,react/no-find-dom-node */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import Button from './Button';

describe('Button', () => {
  const renderer = ReactTestUtils.createRenderer();

  it('should always render as a button', () => {
    renderer.render(<Button />);
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.type).to.equal('button');
  });

  it('should wrap children in div if array', () => {
    renderer.render((
      <Button>
        <span>First</span>
        <span>Second</span>
      </Button>
    ));
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.type).to.equal('button');
    expect(wrapper.props.children.type).to.equal('div');
  });
});
