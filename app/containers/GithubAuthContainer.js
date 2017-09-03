import { connect } from 'react-redux';
import actions from '../actions';
import GithubAuth from '../presentationals/Login/Github';

/**
 * Select props from Redux state.
 * @param {Object} state Current state
 */
const mapStateToProps = (state, props) => {
  const queryParam = new URLSearchParams(props.location.search);

  return {
    pending: !!state.pending[actions.GET_GITHUB_ACCES_TOKEN],
    error: queryParam.get('error_description'),
    state: queryParam.get('state'),
    code: queryParam.get('code'),
  };
};

/**
 * Provide dispatch functions in props.
 * @param {Function} dispatch Redux dispatch function
 */
const mapDispatchToProps = dispatch => ({
  getAccessToken: (state, code) => dispatch(actions.getGithubAccessToken(state, code)),
});

/**
 * GithubAuth connected.
 */
export default connect(mapStateToProps, mapDispatchToProps)(GithubAuth);
