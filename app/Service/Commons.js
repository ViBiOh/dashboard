import { errorHandler } from 'funtch';

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
