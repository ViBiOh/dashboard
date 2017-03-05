/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import ThrobberButton from './ThrobberButton';
import Button from '../Button/Button';
import Throbber from './Throbber';

describe('ThrobberButton', () => {
  it('should render as a Button', () => {
    const wrapper = shallow(<ThrobberButton onClick={() => null} />);

    expect(wrapper.type()).to.equal(Button);
  });

  it('should render with a Throbber if pending', () => {
    const wrapper = shallow(<ThrobberButton onClick={() => null} pending />);

    expect(wrapper.find(Throbber).length).to.equal(1);
  });

  it('should render with children if not pending', () => {
    const wrapper = shallow((
      <ThrobberButton onClick={() => null}>
        <span>Test</span>
      </ThrobberButton>
    ));

    expect(wrapper.find('span').length).to.equal(1);
  });

  it('should call onClick at click', () => {
    const onClick = sinon.spy();

    const wrapper = shallow(<ThrobberButton onClick={onClick} />);
    wrapper.simulate('click');

    expect(onClick.called).to.equal(true);
  });

  it('should not call onClick if pending', () => {
    const onClick = sinon.spy();

    const wrapper = shallow(<ThrobberButton onClick={onClick} pending />);
    wrapper.simulate('click');

    expect(onClick.called).to.equal(false);
  });
});
