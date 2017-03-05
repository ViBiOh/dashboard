/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import Button from './Button';

describe('Button', () => {
  it('should always render as a button', () => {
    const wrapper = shallow(<Button />);

    expect(wrapper.type()).to.equal('button');
  });

  it('should not wrap if one child', () => {
    const wrapper = shallow((
      <Button>
        <span>First</span>
      </Button>
    ));

    expect(wrapper.type()).to.equal('button');
    expect(wrapper.find('span').length).to.equal(1);
  });

  it('should wrap children in div', () => {
    const wrapper = shallow((
      <Button>
        <span>First</span>
        <span>Second</span>
      </Button>
    ));

    expect(wrapper.type()).to.equal('button');
    expect(wrapper.find('div').length).to.equal(1);
  });
});
