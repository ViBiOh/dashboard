import { connect } from 'react-redux';
import actions from './actions';
import BasicAuth from '../Presentational/Login/BasicAuth';

const mapStateToProps = state => ({
  pending: !!state.pending[actions.LOGIN],
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onLogin: (username, password) => dispatch(actions.login(username, password)),
});

/**
 * Container for handling login view.
 */
export default connect(mapStateToProps, mapDispatchToProps)(BasicAuth);
