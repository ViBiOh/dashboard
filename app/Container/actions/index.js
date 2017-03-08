const makeActionCreator = (type, ...argNames) => (...args) => {
  const action = { type };
  argNames.forEach((arg, index) => {
    action[argNames[index]] = args[index];
  });

  return action;
};

const toEventName = name => String(name).replace(/(?!^)([A-Z])/g, '_$1').toUpperCase();

const makeActionAndTypeCreator = (type, action, inputs = []) => ({
  [type]: type,
  [action]: makeActionCreator(type, ...inputs),
});

function makeApiActionCreator(camelCaseName, inputs = [], outputs = []) {
  const cleanName = toEventName(camelCaseName);

  return {
    ...makeActionAndTypeCreator(cleanName, camelCaseName, inputs),
    ...makeActionAndTypeCreator(`${cleanName}_SUCCEEDED`, `${camelCaseName}Succeeded`, outputs),
    ...makeActionAndTypeCreator(`${cleanName}_FAILED`, `${camelCaseName}Failed`, ['error']),
  };
}

function makeOpenCloseActionCreator(camelCaseName, opens = [], closes = []) {
  const cleanName = toEventName(camelCaseName);

  return {
    ...makeActionAndTypeCreator(`OPEN_${cleanName}`, `open${camelCaseName}`, opens),
    ...makeActionAndTypeCreator(`CLOSE_${cleanName}`, `close${camelCaseName}`, closes),
  };
}

export default {
  ...makeApiActionCreator('login', ['username', 'password']),
  ...makeApiActionCreator('logout'),
  ...makeApiActionCreator('fetchContainers', [], ['containers']),
  ...makeApiActionCreator('fetchContainer', ['id'], ['container']),
  ...makeApiActionCreator('actionContainer', ['action', 'id']),
  ...makeApiActionCreator('compose', ['name', 'file']),
  ...makeOpenCloseActionCreator('Logs', ['id']),
  ...makeOpenCloseActionCreator('Events'),
  ...makeActionAndTypeCreator('ADD_LOG', 'addLog', ['log']),
};
