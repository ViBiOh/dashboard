import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import actions from './actions';
import Compose from '../Presentational/Compose/Compose';

const mapStateToProps = state => ({
  pending: !!state.pending[actions.COMPOSE],
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onCompose: () => dispatch(actions.compose()),
  onComposeChange: (name, file) => dispatch(actions.composeChange(name, file)),
  onBack: () => dispatch(push('/')),
});

const ComposeContainer = connect(mapStateToProps, mapDispatchToProps)(Compose);

/**
 * Container for handling compose view.
 */
export default ComposeContainer;
