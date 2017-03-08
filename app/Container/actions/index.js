function makeActionCreator(type, ...argNames) {
  return (...args) => {
    const action = { type };
    argNames.forEach((arg, index) => {
      action[argNames[index]] = args[index];
    });

    return action;
  };
}

const SUCCESS_SUFFIX = '_SUCCEEDED';
const FAIL_SUFFIX = '_FAILED';

function makeApiActionCreator(camelCaseName, inputs = [], outputs = []) {
  const cleanName = String(camelCaseName).replace(/([A-Z])/, '_$1').toUpperCase();
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

export default {
  ...makeApiActionCreator('login', ['username', 'password']),
  ...makeApiActionCreator('logout'),
  ...makeApiActionCreator('fetchContainers', [], ['containers']),
  ...makeApiActionCreator('fetchContainer', ['id'], ['container']),
  ...makeApiActionCreator('actionContainer', ['action', 'id']),
  ...makeApiActionCreator('compose', ['name', 'file']),
};

export const OPEN_LOGS = 'OPEN_LOGS';
export const openLogs = makeActionCreator(OPEN_LOGS, 'id');

export const CLOSE_LOGS = 'CLOSE_LOGS';
export const closeLogs = makeActionCreator(CLOSE_LOGS);

export const ADD_LOG = 'ADD_LOG';
export const addLog = makeActionCreator(ADD_LOG, 'log');

export const OPEN_EVENTS = 'OPEN_EVENTS';
export const openEvents = makeActionCreator(OPEN_EVENTS);

export const CLOSE_EVENTS = 'CLOSE_EVENTS';
export const closeEvents = makeActionCreator(CLOSE_EVENTS);
