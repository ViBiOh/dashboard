import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import actions from './actions';
import ContainersList from '../Presentational/ContainersList/ContainersList';

const mapStateToProps = state => ({
  pending: !!state.pending[actions.FETCH_CONTAINERS],
  pendingInfo: !!state.pending[actions.INFO],
  containersTotalCount: state.containers ? state.containers.length : 0,
  containers: state.filteredContainers,
  filter: state.filter,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onRefresh: () => dispatch(actions.info()),
  onAdd: () => dispatch(push('/containers/New')),
  onSelect: id => dispatch(push(`/containers/${id}`)),
  onLogout: () => dispatch(actions.logout()),
  onFilterChange: value => dispatch(actions.changeFilter(value)),
});

const ContainersListContainer = connect(mapStateToProps, mapDispatchToProps)(ContainersList);

/**
 * Container for handling list view.
 */
export default ContainersListContainer;
