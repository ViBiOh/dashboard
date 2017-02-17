import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { COMPOSE, compose } from './actions';
import Compose from '../Presentational/Compose/Compose';

const mapStateToProps = state => ({
  pending: !!state.pending[COMPOSE],
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onCompose: (name, file) => dispatch(compose(name, file)),
  onBack: () => dispatch(push('/')),
});

const ComposeContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Compose);

export default ComposeContainer;
