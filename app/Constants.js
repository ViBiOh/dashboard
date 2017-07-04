const IS_SECURE = process.env.API_SECURE || /^https/.test(document.location.origin);
const API_HOST =
  process.env.API_HOST || document.location.host.replace(/dashboard/i, 'dashboard-api');

/**
 * URL for API requests
 * @type {String}
 */
export const API = `http${IS_SECURE ? 's' : ''}://${API_HOST}/`;

/**
 * URL for WebSocket requests
 * @type {String}
 */
export const WS = `ws${IS_SECURE ? 's' : ''}://${API_HOST}/ws/`;
