import { connect } from 'react-redux';
import GithubAuth from '../presentationals/Login/Github';
import SearchParams from '../utils/SearchParams';
import actions from '../actions';

/**
 * Select props from Redux state.
 * @param {Object} state Current state
 */
const mapStateToProps = (state, props) => {
  const queryParam = SearchParams(props.location.search);

  return {
    pending: !!state.pending[actions.GET_GITHUB_ACCES_TOKEN],
    error: queryParam.error_description || state.error,
    state: queryParam.state,
    code: queryParam.code,
    redirect: queryParam.redirect,
  };
};

/**
 * Provide dispatch functions in props.
 * @param {Function} dispatch Redux dispatch function
 */
const mapDispatchToProps = dispatch => ({
  getAccessToken: (state, code, redirect) =>
    dispatch(actions.getGithubAccessToken(state, code, redirect)),
});

/**
 * GithubAuth connected.
 */
export default connect(mapStateToProps, mapDispatchToProps)(GithubAuth);
