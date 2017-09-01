import funtch from 'funtch';

/**
 * App context that store variables.
 * @type {Object}
 */
let context = {};

/**
 * Name of Key for storage
 * @type {String}
 */
const STORAGE_KEY_AUTH = 'auth';

/**
 * Initialize context from remote endpoint
 * @return {Promise<Object>} Context
 */
function init() {
  return new Promise((resolve) => {
    funtch.get('/env').then((env) => {
      context = env;
      resolve(context);
    });
  });
}

function getFromContext(key) {
  return context[key];
}

/**
 * Return API endpoint URL
 * @return {String} API endpoint URL
 */
function getApiUrl() {
  return getFromContext('API_URL');
}

/**
 * Return WebSocket endpoint URL
 * @return {String} WebSocket endpoint URL
 */
function getWsUrl() {
  return getFromContext('WS_URL');
}

/**
 * Return OAuth API endpoint URL
 * @return {String} WebSocket endpoint URL
 */
function getAuthApiUrl() {
  return getFromContext('AUTH_URL');
}

/**
 * Return Github Oauth API endpoint URL
 * @return {String} WebSocket endpoint URL
 */
function getGithubOauthUrl() {
  return `http://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    getFromContext('GITHUB_OAUTH_CLIENT_ID'),
  )}&state=${encodeURIComponent(getFromContext('GITHUB_OAUTH_STATE'))}`;
}

/**
 * URL for API requests
 * @type {String}
 */
export {
  init,
  getFromContext,
  getApiUrl,
  getWsUrl,
  getAuthApiUrl,
  getGithubOauthUrl,
  STORAGE_KEY_AUTH,
};
