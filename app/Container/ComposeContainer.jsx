import { connect } from 'react-redux';
import { COMPOSE, compose } from './actions';
import Compose from '../Presentational/Compose/Compose';

const mapStateToProps = state => ({
  pending: !!state.pending[COMPOSE],
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onCompose: (name, file) => dispatch(compose(name, file)),
});

const ComposeContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Compose);

export default ComposeContainer;
