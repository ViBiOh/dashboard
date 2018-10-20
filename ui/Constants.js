import funtch from 'funtch';
import { computeRedirectSearch } from './utils/SearchParams';

/**
 * App context that store variables.
 * @type {Object}
 */
let context = {};

/**
 * Name of Key for storage
 * @type {String}
 */
export const STORAGE_KEY_AUTH = 'auth';

/**
 * Maximum number of stats stored (one per second)
 * @type {Number}
 */
export const STATS_COUNT = 60;

/**
 * Timeout for input debounce.
 * @type {Number}
 */
export const DEBOUNCE_TIMEOUT = 300;

/**
 * Initialize context from remote endpoint
 * @return {Promise<Object>} Context
 */
export function init() {
  return new Promise(resolve => {
    if (process.env.NODE_ENV === 'development') {
      context = {
        API_URL: 'http://localhost:1082',
        AUTH_URL: 'http://localhost:1081',
        BASIC_AUTH_ENABLED: 'true',
        ENVIRONMENT: 'dev',
        GITHUB_AUTH_ENABLED: 'false',
        WS_URL: 'ws://localhost:1082/ws',
      };

      resolve(context);
    } else if (process.env.NODE_ENV === 'staging') {
      context = {
        API_URL: 'https://dashboard-api.vibioh.fr',
        AUTH_URL: 'https://dashboard-auth.vibioh.fr',
        BASIC_AUTH_ENABLED: 'false',
        ENVIRONMENT: 'dev',
        GITHUB_AUTH_ENABLED: 'true',
        WS_URL: 'wss://dashboard-api.vibioh.fr/ws',
      };

      resolve(context);
    } else {
      funtch.get('/env').then(env => {
        context = env;
        resolve(context);
      });
    }
  });
}

/**
 * Get given key from context.
 * @param {String} key Wanted key
 * @return {String} Value from context
 */
export function getFromContext(key) {
  return context[key];
}

/**
 * Return API endpoint URL
 * @return {String} API endpoint URL
 */
export function getApiUrl() {
  return getFromContext('API_URL');
}

/**
 * Return WebSocket endpoint URL
 * @return {String} WebSocket endpoint URL
 */
export function getWsUrl() {
  return getFromContext('WS_URL');
}

/**
 * Return OAuth API endpoint URL
 * @return {String} WebSocket endpoint URL
 */
export function getAuthApiUrl() {
  return getFromContext('AUTH_URL');
}

/**
 * Return Github Oauth API endpoint URL
 * @return {String} WebSocket endpoint URL
 */
export function getGithubOauthUrl(redirect) {
  return `${getAuthApiUrl()}/redirect/github${computeRedirectSearch(redirect)}`;
}
