function makeActionCreator(type, ...argNames) {
  return (...args) => {
    const action = { type };
    argNames.forEach((arg, index) => {
      action[argNames[index]] = args[index];
    });

    return action;
  };
}

const toEventName = name => String(name).replace(/(?!^)([A-Z])/g, '_$1').toUpperCase();

const SUCCESS_SUFFIX = '_SUCCEEDED';
const FAIL_SUFFIX = '_FAILED';

function makeApiActionCreator(camelCaseName, inputs = [], outputs = []) {
  const cleanName = toEventName(camelCaseName);
  const successName = `${cleanName}${SUCCESS_SUFFIX}`;
  const failName = `${cleanName}${FAIL_SUFFIX}`;

  return {
    [cleanName]: cleanName,
    [camelCaseName]: makeActionCreator(cleanName, ...inputs),
    [successName]: successName,
    [`${camelCaseName}Succeeded`]: makeActionCreator(successName, ...outputs),
    [failName]: failName,
    [`${camelCaseName}Failed`]: makeActionCreator(failName, 'error'),
  };
}

const OPEN_PREFIX = 'OPEN_';
const CLOSE_PREFIX = 'CLOSE_';

function makeOpenCloseActionCreator(camelCaseName, inputs = []) {
  const cleanName = toEventName(camelCaseName);
  const openName = `${OPEN_PREFIX}${cleanName}`;
  const closeName = `${CLOSE_PREFIX}${cleanName}`;

  return {
    [openName]: openName,
    [`open${camelCaseName}`]: makeActionCreator(openName, ...inputs),
    [closeName]: closeName,
    [`close${camelCaseName}`]: makeActionCreator(closeName, ...inputs),
  };
}

const ADD_LOG = 'ADD_LOG';

export default {
  ...makeApiActionCreator('login', ['username', 'password']),
  ...makeApiActionCreator('logout'),
  ...makeApiActionCreator('fetchContainers', [], ['containers']),
  ...makeApiActionCreator('fetchContainer', ['id'], ['container']),
  ...makeApiActionCreator('actionContainer', ['action', 'id']),
  ...makeApiActionCreator('compose', ['name', 'file']),
  ...makeOpenCloseActionCreator('Logs', ['id']),
  ...makeOpenCloseActionCreator('Events'),
  ADD_LOG,
  addLog: makeActionCreator(ADD_LOG, 'log'),
};
