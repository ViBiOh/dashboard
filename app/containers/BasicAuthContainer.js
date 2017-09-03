import { connect } from 'react-redux';
import actions from '../actions';
import BasicAuth from '../presentationals/Login/Basic';

/**
 * Select props from Redux state.
 * @param {Object} state Current state
 */
const mapStateToProps = state => ({
  pending: !!state.pending[actions.LOGIN],
  error: state.error,
});

/**
 * Provide dispatch functions in props.
 * @param {Function} dispatch Redux dispatch function
 */
const mapDispatchToProps = dispatch => ({
  onLogin: (username, password) => dispatch(actions.login(username, password)),
});

/**
 * Container for handling login view.
 */
export default connect(mapStateToProps, mapDispatchToProps)(BasicAuth);
