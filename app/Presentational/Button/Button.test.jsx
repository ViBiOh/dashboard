/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { createRenderer } from 'react-addons-test-utils';
import Button from './Button';

describe('Button', () => {
  const renderer = createRenderer();

  it('should always render as a button', () => {
    renderer.render(<Button />);
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.type).to.equal('button');
  });

  it('should not wrap if one child', () => {
    renderer.render((
      <Button>
        <span>First</span>
      </Button>
    ));
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.type).to.equal('button');
    expect(wrapper.props.children.type).to.equal('span');
  });

  it('should wrap children in div', () => {
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
