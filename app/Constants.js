const IS_SECURE = process.env.API_SECURE || /^https/.test(document.location.origin);
const API_HOST =
  process.env.API_HOST || document.location.host.replace(/dashboard/i, 'dashboard-api');

export const API = `http${IS_SECURE ? 's' : ''}://${API_HOST}/`;
export const WS = `ws${IS_SECURE ? 's' : ''}://${API_HOST}/ws/`;
