import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { buildFullTextRegex, fullTextRegexFilter } from '../Search/FullTextSearch';
import actions from './actions';
import ContainersList from '../Presentational/ContainersList/ContainersList';

function flatValues(o) {
  return [].concat(...Object.values(o)
    .filter(e => typeof e !== 'function')
    .map((e) => {
      if (typeof e === 'object') {
        return deepValues(e);
      }
      return e;
    }));
}

const mapStateToProps = (state) => {
  const regexFilter = buildFullTextRegex(state.filter);

  return {
    pending: !!state.pending[actions.FETCH_CONTAINERS],
    pendingInfo: !!state.pending[actions.INFO],
    containers: state.containers
      ? state.containers.filter(e => fullTextRegexFilter(flatValues(e).join(' '), regexFilter))
      : state.containers,
    filter: state.filter,
    error: state.error,
  };
};

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
