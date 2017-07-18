import React, { Component } from 'react';
import PropTypes from 'prop-types';
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

/**
 * Container without connect for testing purpose
 */
export class ContainersListContainerComponent extends Component {
  /**
   * Retrieval of query string for populating ReduxState.
   */
  componentDidMount() {
    const filter = new URLSearchParams(this.props.location.search).get('filter');
    if (filter && filter !== this.props.filter) {
      this.props.onFilterChange(filter);
    }
  }

  /**
   * Render of presentational component.
   */
  render() {
    return <ContainersList {...this.props} />;
  }
}

ContainersListContainerComponent.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string.isRequired,
  }).isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

/**
 * Container for handling list view.
 */
export default connect(mapStateToProps, mapDispatchToProps)(ContainersListContainerComponent);
