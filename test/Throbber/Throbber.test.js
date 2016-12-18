/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import Throbber from '../../app/Throbber/Throbber';

describe('Throbber', () => {
  it('should render empty', () => {
    const component = TestUtils.renderIntoDocument(new Throbber({}));

    expect(!!component).to.be.true;
  });

  it('should have no label by default', () => {
    const component = TestUtils.renderIntoDocument(new Throbber({}));
    const result = ReactDOM.findDOMNode(component).getElementsByTagName('span').length === 0;

    expect(result).to.be.true;
  });

  it('should have a label when given', () => {
    const component = TestUtils.renderIntoDocument(new Throbber({ label: 'Test Mocha' }));
    const result = ReactDOM.findDOMNode(component).getElementsByTagName('span')[0].innerHTML;

    expect(result).to.equal('Test Mocha');
  });
});
