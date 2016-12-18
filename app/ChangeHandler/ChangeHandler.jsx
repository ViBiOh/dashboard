export const DIRTY_PATTERN = /.*?->.+Dirty$/;

function getDirtyFlags(instance) {
  return Object.keys(instance)
    .filter(e => DIRTY_PATTERN.test(e));
}

function getDirtyFlagsValues(instance) {
  return getDirtyFlags(instance).map(key => instance[key]);
}

export function cleanDirtyFlags(instance) {
  const dirtyState = getDirtyFlags(instance.state).reduce((previous, current) => {
    previous[current] = false; // eslint-disable-line no-param-reassign

    return previous;
  }, {});

  return new Promise(resolve => instance.setState(dirtyState, resolve));
}

export default function onValueChange(instance, key, stateKey, previousValue, dirtyCallback) {
  const stateCallback = obj => new Promise(resolve => instance.setState(obj, (data) => {
    if (typeof dirtyCallback === 'function') {
      dirtyCallback(...getDirtyFlagsValues(instance.state));
    }
    resolve(data);
  }));

  const stateKeyDefined = typeof stateKey !== 'undefined';

  let usedKey = `->${key}`;
  if (stateKeyDefined) {
    usedKey = `${stateKey}${usedKey}`;
  }

  return (value) => {
    let obj = {};
    obj[key] = value;

    if (stateKeyDefined) {
      const innerObj = {};
      innerObj[stateKey] = Object.assign(instance.state[stateKey], obj);
      obj = innerObj;
    }

    if (typeof previousValue !== 'undefined') {
      obj[`${usedKey}Dirty`] = previousValue !== value;
    }

    return stateCallback(obj);
  };
}
