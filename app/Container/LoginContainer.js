import { connect } from 'react-redux';
import actions from './actions';
import Login from '../Presentational/Login/Login';

const mapStateToProps = state => ({
  pending: !!state.pending[actions.LOGIN],
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onLogin: (username, password) => dispatch(actions.login(username, password)),
});

const LoginContainer = connect(mapStateToProps, mapDispatchToProps)(Login);

/**
 * Container for handling login view.
 */
export default LoginContainer;
