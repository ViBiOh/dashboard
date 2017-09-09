import funtch from 'funtch';
import btoa from '../../utils/btoa';
import { getAuthApiUrl } from '../../Constants';
import { customError, auth } from '../Commons';

/**
 * OAuth API Service.
 */
export default class Auth {
  /**
   * Retrieve access token
   * @param  {String} state State provided during oauth process
   * @param  {String} code  Code returned by oauth provider
   * @return {Promise} Request
   */
  static getGithubAccessToken(state, code) {
    return funtch
      .url(
        `${getAuthApiUrl()}/token/github?state=${encodeURIComponent(
          state,
        )}&code=${encodeURIComponent(code)}`,
      )
      .error(customError)
      .get();
  }

  /**
   * Login User given username and password.
   * @param  {String} username User's username
   * @param  {String} password User's password
   * @return {Promise}         Token wrapped in a Promise
   */
  static basicLogin(username, password) {
    const hash = `Basic ${btoa(`${username}:${password}`)}`;

    return auth(`${getAuthApiUrl()}/user`, hash)
      .get()
      .then(() => hash);
  }
}
