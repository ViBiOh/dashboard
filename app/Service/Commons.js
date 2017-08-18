import funtch, { errorHandler } from 'funtch';
import { STORAGE_KEY_AUTH } from '../Constants';
import localStorageService from './LocalStorageService';

/**
 * Custom error handler that add toString to error object.
 * @param  {Object} response Response from funtch
 * @return {Promise} Error with toString or valid reponse
 */
// eslint-disable-next-line import/prefer-default-export
export function customError(response) {
  return new Promise((resolve, reject) =>
    errorHandler(response).then(resolve).catch(err =>
      reject({
        ...err,
        toString: () => {
          if (typeof err.content === 'string') {
            return err.content;
          }
          return JSON.stringify(err.content);
        },
      }),
    ),
  );
}

/**
 * Generate FetchBuilder for given URL with auth and error handler.
 * @param  {String} url              Wanted URL
 * @param  {String} authentification Auth value
 * @return {FetchBuilder} FetchBuilder pre-configured
 */
export function auth(url, authentification = localStorageService.getItem(STORAGE_KEY_AUTH)) {
  if (!authentification) {
    const authError = new Error('Authentification not find');
    authError.noAuth = true;
    throw authError;
  }

  return funtch.url(url).error(customError).auth(authentification);
}
