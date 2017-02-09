import { connect } from 'react-redux';
import { login } from './actions';
import Login from '../Presentational/Login/Login';

const mapStateToProps = state => ({
  loginPending: state.loginPending,
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
