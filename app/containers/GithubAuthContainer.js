import { connect } from 'react-redux';
import actions from '../actions';
import GithubAuth from '../presentationals/Login/GithubAuth';

const mapStateToProps = (state, props) => {
  const queryParam = new URLSearchParams(props.location.search);

  return {
    pending: !!state.pending[actions.GET_GITHUB_ACCES_TOKEN],
    error: queryParam.get('error_description'),
    state: queryParam.get('state'),
    code: queryParam.get('code'),
  };
};

const mapDispatchToProps = dispatch => ({
  getAccessToken: (state, code) => dispatch(actions.getGithubAccessToken(state, code)),
});

/**
 * GithubAuth connected.
 */
export default connect(mapStateToProps, mapDispatchToProps)(GithubAuth);
