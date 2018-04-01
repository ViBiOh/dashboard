import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import SearchParams from '../utils/SearchParams';
import actions from '../actions';
import ContainersList from '../presentationals/ContainersList';

/**
 * Select props from Redux state.
 * @param {Object} state Current state
 */
const mapStateToProps = state => ({
  pending: !!state.pending[actions.INFO] || !!state.pending[actions.FETCH_CONTAINERS],
  containersTotalCount: state.containers ? state.containers.length : 0,
  containers: state.filteredContainers,
  filter: state.filter,
  error: state.error,
});

/**
 * Provide dispatch functions in props.
 * @param {Function} dispatch Redux dispatch function
 */
const mapDispatchToProps = dispatch => ({
  onRefresh: () => dispatch(actions.refresh()),
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
   * React lifecycle.
   * Retrieval of query string for synchronizing ReduxState and History.
   */
  componentDidMount() {
    const queryFilter = SearchParams(this.props.location.search).filter;

    if (queryFilter && !this.props.filter) {
      this.props.onFilterChange(queryFilter);
    } else if (!queryFilter && this.props.filter) {
      this.props.onFilterChange(this.props.filter);
    }
  }

  /**
   * React lifecycle.
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
