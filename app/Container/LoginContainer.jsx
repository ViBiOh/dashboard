import { connect } from 'react-redux';
import { login, LOGIN } from './actions';
import Login from '../Presentational/Login/Login';

const mapStateToProps = state => ({
  loginPending: !!state.pending[LOGIN],
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onLogin: (username, password) => dispatch(login(username, password)),
});

const LoginContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Login);

export default LoginContainer;
