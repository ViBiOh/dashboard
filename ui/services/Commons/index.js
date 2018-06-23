import funtch, { errorHandler } from 'funtch';
import { STORAGE_KEY_AUTH } from '../../Constants';
import localStorage from '../LocalStorage';

/**
 * Default HTTP error message.
 * @type {Object}
 */
const httpErrorMessage = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Time-out',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Requested range unsatisfiable',
  417: 'Expectation failed',
  418: 'I’m a teapot',
  421: 'Bad mapping / Misdirected Request',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway ou Proxy Error',
  503: 'Service Unavailable',
  504: 'Gateway Time-out',
};

/**
 * Custom error handler that add toString to error object.
 * @param  {Object} response Response from funtch
 * @return {Promise} Error with toString or valid reponse
 */
// eslint-disable-next-line import/prefer-default-export
export function customError(response) {
  return new Promise((resolve, reject) =>
    errorHandler(response)
      .then(resolve)
      .catch(err =>
        reject(
          new Error({
            ...err,
            toString: () => {
              if (!err.content && httpErrorMessage[err.status]) {
                return httpErrorMessage[err.status];
              }

              if (typeof err.content === 'string') {
                return err.content;
              }

              return JSON.stringify(err.content);
            },
          }),
        ),
      ),
  );
}

/**
 * Generate FetchBuilder for given URL with auth and error handler.
 * @param  {String} url              Wanted URL
 * @param  {String} authentification Auth value
 * @return {FetchBuilder} FetchBuilder pre-configured
 */
export function auth(url, authentification = localStorage.getItem(STORAGE_KEY_AUTH)) {
  if (!authentification) {
    const authError = new Error('Authentification not find');
    authError.noAuth = true;
    throw authError;
  }

  return funtch
    .url(url)
    .error(customError)
    .auth(authentification);
}
