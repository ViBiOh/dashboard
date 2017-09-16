import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Throbber from '../../Throbber';
import Github from './';

function defaultProps() {
  return {
    getAccessToken: () => null,
  };
}

test('should always render as null if not pending', (t) => {
  t.is(shallow(<Github {...defaultProps()} />).type(), null);
});

test('should always render as null if not pending', (t) => {
  t.is(shallow(<Github {...defaultProps()} pending />).type(), Throbber);
});

test('should retrieve access token if no error', (t) => {
  const getAccessToken = sinon.spy();
  const wrapper = shallow(
    <Github
      {...defaultProps()}
      state="test"
      code="1234567890"
      redirect="containers"
      getAccessToken={getAccessToken}
    />,
  );

  wrapper.instance().componentDidMount();
  t.true(getAccessToken.calledWith('test', '1234567890', 'containers'));
});

test('should not retrieve access token if error', (t) => {
  const getAccessToken = sinon.spy();
  const wrapper = shallow(
    <Github
      {...defaultProps()}
      error="invalid"
      state="test"
      code="1234567890"
      redirect="containers"
      getAccessToken={getAccessToken}
    />,
  );

  wrapper.instance().componentDidMount();
  t.false(getAccessToken.called);
});
