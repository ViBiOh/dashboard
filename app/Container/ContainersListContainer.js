import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import actions from './actions';
import ContainersList from '../Presentational/ContainersList/ContainersList';

const mapStateToProps = state => ({
  pending: !!state.pending[actions.FETCH_CONTAINERS],
  containers: state.containers,
  infos: state.infos,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onRefresh: () => dispatch(actions.fetchContainers()),
  onAdd: () => dispatch(push('/containers/New')),
  onSelect: id => dispatch(push(`/containers/${id}`)),
  onLogout: () => dispatch(actions.logout()),
});

const ContainersListContainer = connect(mapStateToProps, mapDispatchToProps)(ContainersList);

/**
 * Container for handling list view.
 */
export default ContainersListContainer;
