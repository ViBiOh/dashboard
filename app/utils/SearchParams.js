/**
 * Compute redirect param if provided.
 * @param {String} redirect Wanted redirect
 * @returns {String} Encoded redirect query string
 */
export function computeRedirectSearch(redirect) {
  if (Boolean(redirect) && String(redirect).trim() !== '') {
    return `?redirect=${encodeURIComponent(redirect)}`;
  }
  return '';
}

/**
 * Extract search params from given input.
 * @param {String} content Search location (e.g. document.location.search)
 * @returns {Object} Object containing every search param, true for param without value
 */
export default function (content) {
  const params = {};

  if (!content) {
    return params;
  }

  content.replace(/^\?/, '').replace(/([^&=]+)(?:=([^&]*))?/gm, (match, key, value) => {
    // eslint-disable-next-line no-param-reassign
    params[key] = typeof value === 'undefined' ? true : decodeURIComponent(value);
  });

  return params;
}
