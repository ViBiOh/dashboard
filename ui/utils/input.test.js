import test from 'ava';
import sinon from 'sinon';
import onKeyDown from './input';

test('should trigger callback if keydown is return', t => {
  const callback = sinon.spy();

  onKeyDown({ keyCode: 13 }, callback);
  t.true(callback.called);
});

test('should not trigger callback if keydown is not return', t => {
  const callback = sinon.spy();

  onKeyDown({ keyCode: 41 }, callback);
  t.false(callback.called);
});
