import funtch from 'funtch';

let context = {};

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
 * URL for API requests
 * @type {String}
 */
export default { init, getApiUrl, getWsUrl };
