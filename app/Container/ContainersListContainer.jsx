import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FETCH_CONTAINERS, fetchContainers, logout } from './actions';
import ContainersList from '../Presentational/ContainersList/ContainersList';

const mapStateToProps = state => ({
  pending: !!state.pending[FETCH_CONTAINERS],
  containers: state.containers,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  onRefresh: containers => dispatch(fetchContainers(containers)),
  onAdd: () => dispatch(push('/containers/New')),
  onLogout: () => dispatch(logout()),
});

const ContainersListContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContainersList);
export default ContainersListContainer;
