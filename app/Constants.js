import funtch from 'funtch';

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

/**
 * Return API endpoint URL
 * @return {String} API endpoint URL
 */
function getApiUrl() {
  return context.API_URL;
}

/**
 * Return WebSocket endpoint URL
 * @return {String} WebSocket endpoint URL
 */
function getWsUrl() {
  return context.WS_URL;
}

/**
 * Return OAuth API endpoint URL
 * @return {String} WebSocket endpoint URL
 */
function getOauthApiUrl() {
  return context.OAUTH_URL;
}

/**
 * Return Github Oauth API endpoint URL
 * @return {String} WebSocket endpoint URL
 */
function getGithubOauthUrl() {
  return `http://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    context.GITHUB_OAUTH_CLIENT_ID,
  )}&state=${encodeURIComponent(context.GITHUB_OAUTH_STATE)}&redirect_uri=${document.location
    .origin}/auth/github`;
}

/**
 * URL for API requests
 * @type {String}
 */
export { init, getApiUrl, getWsUrl, getOauthApiUrl, getGithubOauthUrl, STORAGE_KEY_AUTH };
