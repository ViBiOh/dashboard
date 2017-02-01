/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import onValueChange, { cleanDirtyFlags } from './ChangeHandler';

describe('ChangeHandler', () => {
  describe('onValueChange', () => {
    let reactElement;
    let setState;

    beforeEach(() => {
      reactElement = {
        state: {},
        setState: () => null,
      };

      setState = sinon.stub(reactElement, 'setState', (value, callback) => {
        reactElement.state = value;
        callback(value);
      });
    });

    afterEach(() => {
      if (setState) {
        setState.restore();
      }
    });

    it('should return a function', () => {
      expect(typeof onValueChange()).to.equal('function');
    });

    it('should call setState when triggered', () => onValueChange(reactElement, 'test')('value')
      .then(() => expect(setState.calledOnce).to.be.true),
    );

    it('should call callback with matching object', () => onValueChange(reactElement, 'test')('value')
      .then(data => expect(data).to.eql({ test: 'value' })),
    );

    it('should call setState with matching object when innerKey', () =>
      onValueChange(Object.assign(reactElement, {
        state: {
          myAwesomeObj: {
            existing: 'key',
          },
        },
      }), 'test', 'myAwesomeObj')('value')
        .then((data) => {
          expect(data).to.eql({ myAwesomeObj: { existing: 'key', test: 'value' } });
        }),
    );

    it('should set dirty flag when old value provided', () =>
      onValueChange(reactElement, 'test', undefined, 'first')('value')
        .then(data => expect(data).to.eql({ test: 'value', '->testDirty': true })),
    );

    it('should set dirty flag false when old value provided but equal', () =>
      onValueChange(reactElement, 'test', undefined, 'value')('value')
        .then(data => expect(data).to.eql({ test: 'value', '->testDirty': false })),
    );

    it('should call dirtyCallback when triggered', () => {
      const handleDirty = sinon.spy();

      return onValueChange(reactElement, 'test', undefined, undefined, handleDirty)('value')
        .then(() => expect(handleDirty.calledOnce).to.be.true);
    });

    it('should call dirtyCallback with appropriates flags', () => {
      const handleDirty = sinon.spy();

      return onValueChange(reactElement, 'test', undefined, 'different', handleDirty)('value')
        .then(() => expect(handleDirty.calledWith(true)).to.be.true);
    });
  });

  describe('cleanDirtyFlags', () => {
    let reactElement;
    let setState;

    beforeEach(() => {
      reactElement = {
        state: {},
        setState: () => null,
      };

      setState = sinon.stub(reactElement, 'setState', (value, callback) => {
        reactElement.state = value;
        callback(value);
      });
    });

    afterEach(() => {
      if (setState) {
        setState.restore();
      }
    });

    it('should not modify object if unnecessary', () => cleanDirtyFlags(reactElement)
      .then(data => expect(data).to.eql({})),
    );

    it('should modify flag to false', () => cleanDirtyFlags(Object.assign(reactElement, {
      state: {
        'myAwesomeObj->existingDirty': true,
        '->libelleDirty': true,
        myAwesomeObj: {
          existing: 'key',
        },
      },
    }))
      .then(data => expect(data).to.eql({
        'myAwesomeObj->existingDirty': false,
        '->libelleDirty': false,
      })),
    );
  });
});
