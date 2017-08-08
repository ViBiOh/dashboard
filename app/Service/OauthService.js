import funtch from 'funtch';
import { getAuthApiUrl } from '../Constants';
import { customError } from './Commons';

/**
 * OAuth API Service.
 */
export default class OauthService {
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
}
