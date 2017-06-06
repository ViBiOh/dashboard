import { connect } from 'react-redux';
import actions from './actions';
import Compose from '../Presentational/Compose/Compose';

const mapStateToProps = state => ({
  pending: !!state.pending[actions.COMPOSE],
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onCompose: (name, file) => dispatch(actions.compose(name, file)),
  onBack: () => dispatch(actions.goHome()),
});

const ComposeContainer = connect(mapStateToProps, mapDispatchToProps)(Compose);

/**
 * Container for handling compose view.
 */
export default ComposeContainer;
