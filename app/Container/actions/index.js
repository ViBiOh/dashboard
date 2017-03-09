/**
 * Action creator : return a function for given action
 * @param  {string}    type      Action type
 * @param  {...objects} argNames Properties' names of action
 * @return {func} Function that generate action with type and properties given the params
 */
const makeActionCreator = (type, ...argNames) => (...args) => {
  const action = { type };
  argNames.forEach((arg, index) => {
    action[argNames[index]] = args[index];
  });

  return action;
};

/**
 * Transform a name into a type name : SNAKE_UPPER_CASE
 * @param  {string} name A camel case action name
 * @return {string} Snake upper case type name
 */
const toTypeName = name => String(name).replace(/(?!^)([A-Z])/g, '_$1').toUpperCase();

const makeActionAndTypeCreator = (type, action, inputs = []) => ({
  [type]: type,
  [action]: makeActionCreator(type, ...inputs),
});

function makeApiActionCreator(camelCaseName, inputs = [], outputs = []) {
  const typeName = toTypeName(camelCaseName);

  return {
    ...makeActionAndTypeCreator(typeName, camelCaseName, inputs),
    ...makeActionAndTypeCreator(`${typeName}_SUCCEEDED`, `${camelCaseName}Succeeded`, outputs),
    ...makeActionAndTypeCreator(`${typeName}_FAILED`, `${camelCaseName}Failed`, ['error']),
  };
}

function makeOpenCloseActionCreator(camelCaseName, opens = [], closes = []) {
  const typeName = toTypeName(camelCaseName);

  return {
    ...makeActionAndTypeCreator(`OPEN_${typeName}`, `open${camelCaseName}`, opens),
    ...makeActionAndTypeCreator(`CLOSE_${typeName}`, `close${camelCaseName}`, closes),
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
