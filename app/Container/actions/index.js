/**
 * Action creator : return a function for given action
 * @param  {string}     type     Action type
 * @param  {...objects} argNames Properties' names of action
 * @return {func}                Function that generate action with type and properties given the
 *                               params
 */
export const makeActionCreator = (type, ...argNames) => (...args) => {
  const action = { type };
  argNames.forEach((arg, index) => {
    action[argNames[index]] = args[index];
  });

  return action;
};

/**
 * Transform a name into a type name : SNAKE_UPPER_CASE
 * @param  {string} name A camel case action name
 * @return {string}      Snake upper case type name
 */
export const toTypeName = name => String(name).replace(/([A-Z])/g, '_$1').toUpperCase();

/**
 * Action creator : return the function and the constant for the given action
 * @param  {string} type   Action type
 * @param  {string} action Action function name
 * @param  {Array}  inputs Properties' names of action
 * @return {object}        An object containing both function and constant
 */
export const makeActionAndTypeCreator = (type, action, inputs = []) => ({
  [type]: type,
  [action]: makeActionCreator(type, ...inputs),
});

/**
 * Action creator for an API call (request, success, fail)
 * @param  {string} camelCaseName CamelCase name of action : the action function name
 * @param  {Array}  inputs        Properties' names of request action
 * @param  {Array}  outputs       Properties' names of response action
 * @return {object}               An object container constants and functions for requesting API
 */
export const makeApiActionCreator = (camelCaseName, inputs = [], outputs = []) => {
  const typeName = toTypeName(camelCaseName);

  return {
    ...makeActionAndTypeCreator(typeName, camelCaseName, inputs),
    ...makeActionAndTypeCreator(`${typeName}_SUCCEEDED`, `${camelCaseName}Succeeded`, outputs),
    ...makeActionAndTypeCreator(`${typeName}_FAILED`, `${camelCaseName}Failed`, ['error']),
  };
};

/**
 * Action creator for an WebSocket call (open, close)
 * @param  {[type]} camelCaseName CamelCase name of action : the action function name
 * @param  {Array}  opens         Properties' names of open action
 * @param  {Array}  closes        Properties' names of close action
 * @return {[type]}               An object container constants and functions for requesting WS
 */
export const makeOpenCloseActionCreator = (camelCaseName, opens = [], closes = []) => {
  const typeName = toTypeName(camelCaseName);
  const camelSuffix = camelCaseName.replace(/^(.)/, (all, char) => char.toUpperCase());

  return {
    ...makeActionAndTypeCreator(`OPEN_${typeName}`, `open${camelSuffix}`, opens),
    ...makeActionAndTypeCreator(`CLOSE_${typeName}`, `close${camelSuffix}`, closes),
  };
};

/**
 * Action creator : return a function for given action
 * @param  {string}     type     Action type
 * @param  {...objects} argNames Properties' names of action
 * @return {func}                Function that generate action with type and properties given the
 *                               params
 */
export const makeBusPayloadActionCreator = (type, streamName, demand) => (id) => {
  let usedId = '';
  if (typeof id !== 'undefined') {
    usedId = ` ${id}`;
  }

  const action = {
    type,
    streamName,
    payload: `${streamName} ${demand}${usedId}`,
  };

  return action;
};

/**
 * Action bus creator : return the function and the constant for the given action
 * @param  {string} type   Action type
 * @param  {string} action Action function name
 * @param  {Array}  inputs Properties' names of action
 * @return {object}        An object containing both function and constant
 */
export const makeBusActionAndTypeCreator = (type, action, inputs = []) => ({
  [type]: type,
  [action]: makeBusPayloadActionCreator(type, ...inputs),
});

/**
 * Action creator for an WebSocket call (open, close)
 * @param  {[type]} camelCaseName CamelCase name of action : the action function name
 * @return {[type]}               An object container constants and functions for requesting WS
 */
export const makeBusActionCreator = (camelCaseName) => {
  const typeName = toTypeName(camelCaseName);
  const camelSuffix = camelCaseName.replace(/^(.)/, (all, char) => char.toUpperCase());

  return {
    ...makeBusActionAndTypeCreator(`OPEN_${typeName}`, `open${camelSuffix}`, [
      camelCaseName,
      'start',
    ]),
    ...makeBusActionAndTypeCreator(`CLOSE_${typeName}`, `close${camelSuffix}`, [
      camelCaseName,
      'end',
    ]),
  };
};

/**
 * App's actions.
 */
export default {
  ...makeApiActionCreator('login', ['username', 'password']),
  ...makeApiActionCreator('logout'),
  ...makeApiActionCreator('info', [], ['infos']),
  ...makeApiActionCreator('fetchServices', [], ['services']),
  ...makeApiActionCreator('fetchContainers', [], ['containers']),
  ...makeApiActionCreator('fetchContainer', ['id'], ['container']),
  ...makeApiActionCreator('actionContainer', ['action', 'id']),
  ...makeApiActionCreator('compose', ['name', 'file']),
  ...makeOpenCloseActionCreator('bus'),
  ...makeBusActionCreator('events'),
  ...makeBusActionCreator('logs'),
  ...makeBusActionCreator('stats'),
  ...makeActionAndTypeCreator('ADD_LOG', 'addLog', ['log']),
  ...makeActionAndTypeCreator('ADD_STAT', 'addStat', ['stat']),
  ...makeActionAndTypeCreator('SET_ERROR', 'setError', ['error']),
  ...makeActionAndTypeCreator('GO_HOME', 'goHome'),
};
