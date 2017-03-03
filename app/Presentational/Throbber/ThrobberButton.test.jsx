/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { createRenderer } from 'react-addons-test-utils';
import ThrobberButton from './ThrobberButton';
import Button from '../Button/Button';
import Throbber from './Throbber';

describe('ThrobberButton', () => {
  const renderer = createRenderer();

  it('should render as a Button', () => {
    renderer.render(<ThrobberButton />);
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.type).to.equal(Button);
  });

  it('should render with a Throbber if pending', () => {
    renderer.render(<ThrobberButton pending />);
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.props.children.type).to.equal(Throbber);
  });

  it('should render with children if not pending', () => {
    renderer.render((
      <ThrobberButton>
        <span>Test</span>
      </ThrobberButton>
    ));
    const wrapper = renderer.getRenderOutput();

    expect(wrapper.props.children.type).to.equal('span');
  });
});
