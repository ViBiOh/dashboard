import { connect } from 'react-redux';
import actions from 'actions';
import Compose from 'presentationals/Compose';

/**
 * Select props from Redux state.
 * @param {Object} state Current state
 */
const mapStateToProps = state => ({
  pending: !!state.pending[actions.COMPOSE],
  error: state.error,
});

/**
 * Provide dispatch functions in props.
 * @param {Function} dispatch Redux dispatch function
 */
const mapDispatchToProps = dispatch => ({
  onCompose: (name, file) =>
    dispatch(
      actions.compose(
        name,
        file,
      ),
    ),
  onBack: () => dispatch(actions.goHome()),
});

/**
 * Container for handling compose view.
 */
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Compose);
