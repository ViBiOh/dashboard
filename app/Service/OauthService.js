import funtch from 'funtch';
import { getOauthApiUrl } from '../Constants';
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
        `${getOauthApiUrl()}/github/access_token?state=${encodeURIComponent(
          state,
        )}&code=${encodeURIComponent(code)}`,
      )
      .error(customError)
      .get();
  }
}
